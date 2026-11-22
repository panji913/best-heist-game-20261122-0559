// Vaultbreak — game loop, stealth detection, alarm, levels and states.
import { VIEW, PLAYER, GUARD, CAMERA, ALARM, SCORE } from './config.js';
import { LEVELS } from './world.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { render } from './render.js';
import { clamp, dist, angleTo, angleDiff, segmentHitsRect, circleRectResolve } from './random.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sfx = new Sfx();

const game = {
  state: 'title', // title | play | paused | busted | levelclear | win
  time: 0,
  levelIndex: 0,
  level: LEVELS[0],
  player: { x: 90, y: 640, sneaking: false },
  guards: [],
  cameras: [],
  loot: [],
  coins: [],
  coinsLeft: PLAYER.coinsPerLevel,
  alarm: 0,
  score: 0,
  lootTaken: 0,
  lootTotal: 0,
  lootLeft: 0,
  nearLoot: null,
  levelTime: 0,
  totalTime: 0,
  busts: 0,
  lastBonus: 0,
  alarmTickAt: 0,
};

function loadLevel(index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.level = def;
  game.player = { x: def.spawn.x, y: def.spawn.y, sneaking: false };
  game.guards = def.guards.map((g) => ({
    waypoints: g.waypoints,
    wp: 0,
    x: g.waypoints[0][0],
    y: g.waypoints[0][1],
    facing: 0,
    speed: g.speed,
    mode: 'patrol', // patrol | chase | investigate
    range: GUARD.viewRange,
    half: GUARD.viewHalfAngle,
    loseTimer: 0,
    investigateAt: null,
    investigateTimer: 0,
  }));
  game.cameras = def.cameras.map((c) => ({
    x: c.x, y: c.y,
    baseAngle: c.baseAngle,
    sweep: c.sweep,
    angle: c.baseAngle,
    half: CAMERA.viewHalfAngle,
    range: CAMERA.viewRange,
    seesPlayer: false,
    phase: 0,
  }));
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.coins = [];
  game.coinsLeft = PLAYER.coinsPerLevel;
  game.alarm = 0;
  game.lootTaken = 0;
  game.lootTotal = def.loot.length;
  game.lootLeft = def.loot.length;
  game.nearLoot = null;
  game.levelTime = 0;
}

function losBlocked(ax, ay, bx, by) {
  for (const w of game.level.walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return true;
  }
  return false;
}

function canSee(x, y, angle, half, range, px, py, sneaking) {
  const d = dist(x, y, px, py);
  const effRange = sneaking ? range * GUARD.sneakRangeFactor : range;
  if (d > effRange) return false;
  if (angleDiff(angleTo(x, y, px, py), angle) > half) return false;
  if (losBlocked(x, y, px, py)) return false;
  return true;
}

function movePlayer(dt) {
  const mv = input.moveVector();
  const sneaking = input.down('shift');
  game.player.sneaking = sneaking && (mv.x !== 0 || mv.y !== 0);
  const speed = game.player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  let nx = game.player.x + mv.x * speed * dt;
  let ny = game.player.y + mv.y * speed * dt;
  nx = clamp(nx, 12 + PLAYER.radius, VIEW.w - 12 - PLAYER.radius);
  ny = clamp(ny, 64 + 10 + PLAYER.radius, VIEW.h - 12 - PLAYER.radius);
  // axis-separated wall resolve
  let px = nx, py = game.player.y;
  for (const w of game.level.walls) {
    const r = circleRectResolve(px, py, PLAYER.radius, w);
    if (r) { px = r.x; py = r.y; }
  }
  nx = px;
  py = ny;
  for (const w of game.level.walls) {
    const r = circleRectResolve(nx, py, PLAYER.radius, w);
    if (r) { nx = r.x; py = r.y; }
  }
  game.player.x = nx;
  game.player.y = py;
}

function updateGuards(dt) {
  const p = game.player;
  for (const g of game.guards) {
    const sees = canSee(g.x, g.y, g.facing, g.half, g.range, p.x, p.y, p.sneaking);
    if (sees) {
      if (g.mode !== 'chase') sfx.spotted();
      g.mode = 'chase';
      g.loseTimer = GUARD.loseSightSeconds;
      g.facing = angleTo(g.x, g.y, p.x, p.y);
      game.alarm += (p.sneaking ? GUARD.spotRateSneak : GUARD.spotRate) * dt;
    } else if (g.mode === 'chase') {
      g.loseTimer -= dt;
      if (g.loseTimer <= 0) g.mode = 'patrol';
    }

    if (g.mode === 'chase') {
      const a = angleTo(g.x, g.y, p.x, p.y);
      g.facing = a;
      g.x += Math.cos(a) * GUARD.chaseSpeed * dt;
      g.y += Math.sin(a) * GUARD.chaseSpeed * dt;
      g.x = clamp(g.x, 26, VIEW.w - 26);
      g.y = clamp(g.y, 90, VIEW.h - 26);
      // caught: a chasing guard touching the thief ends the room
      if (dist(g.x, g.y, p.x, p.y) < GUARD.radius + PLAYER.radius - 2) {
        game.alarm = ALARM.bustedAt;
      }
    } else if (g.mode === 'investigate' && g.investigateAt) {
      const a = angleTo(g.x, g.y, g.investigateAt.x, g.investigateAt.y);
      g.facing = a;
      const d = dist(g.x, g.y, g.investigateAt.x, g.investigateAt.y);
      if (d > 8) {
        g.x += Math.cos(a) * GUARD.investigateSpeed * dt;
        g.y += Math.sin(a) * GUARD.investigateSpeed * dt;
      } else {
        g.investigateTimer -= dt;
        if (g.investigateTimer <= 0) { g.mode = 'patrol'; g.investigateAt = null; }
      }
    } else {
      // patrol the waypoint loop
      const wp = g.waypoints[g.wp];
      const d = dist(g.x, g.y, wp[0], wp[1]);
      if (d < 6) {
        g.wp = (g.wp + 1) % g.waypoints.length;
      } else {
        const a = angleTo(g.x, g.y, wp[0], wp[1]);
        g.facing = a;
        g.x += Math.cos(a) * g.speed * dt;
        g.y += Math.sin(a) * g.speed * dt;
      }
    }
  }
}

function updateCameras(dt) {
  const p = game.player;
  for (const cam of game.cameras) {
    cam.phase += CAMERA.sweepSpeed * dt;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
    const sees = canSee(cam.x, cam.y, cam.angle, cam.half, cam.range, p.x, p.y, p.sneaking);
    cam.seesPlayer = sees;
    if (sees) game.alarm += CAMERA.spotRate * dt;
  }
}

function updateLoot() {
  const p = game.player;
  game.nearLoot = null;
  for (const loot of game.loot) {
    if (loot.taken) continue;
    if (dist(p.x, p.y, loot.x, loot.y) < PLAYER.grabRadius) game.nearLoot = loot;
  }
  if (game.nearLoot && input.wasPressed('e', ' ')) {
    game.nearLoot.taken = true;
    game.lootTaken += 1;
    game.lootLeft -= 1;
    game.score += SCORE.loot;
    sfx.pickup();
  }
}

function tossCoin() {
  if (!input.click || game.coinsLeft <= 0) return;
  const { x, y } = input.click;
  if (y < 64 + 10) return; // HUD is not the floor
  game.coins.push({ x, y });
  game.coinsLeft -= 1;
  sfx.coin();
  for (const g of game.guards) {
    if (g.mode === 'patrol' && dist(g.x, g.y, x, y) < 340) {
      g.mode = 'investigate';
      g.investigateAt = { x, y };
      g.investigateTimer = 3;
    }
  }
}

function updatePlay(dt) {
  game.levelTime += dt;
  game.totalTime += dt;
  movePlayer(dt);
  tossCoin();
  updateGuards(dt);
  updateCameras(dt);
  updateLoot();

  // alarm decays when nobody sees you
  const seen = game.guards.some((g) => g.mode === 'chase') || game.cameras.some((c) => c.seesPlayer);
  if (!seen) game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  game.alarm = clamp(game.alarm, 0, ALARM.bustedAt);
  if (game.alarm >= ALARM.warnAt && game.time - game.alarmTickAt > 0.7) {
    game.alarmTickAt = game.time;
    sfx.alarmTick();
  }

  if (game.alarm >= ALARM.bustedAt) {
    game.state = 'busted';
    game.busts += 1;
    sfx.busted();
    return;
  }

  // exit opens once every loot is taken
  if (game.lootLeft === 0) {
    const ex = game.level.exit;
    const p = game.player;
    if (p.x > ex.x - 6 && p.x < ex.x + ex.w + 6 && p.y > ex.y - 6 && p.y < ex.y + ex.h + 6) {
      const timeBonus = Math.max(0, Math.round((game.level.par - game.levelTime) * SCORE.timeBonusPerSecond));
      const sneakBonus = game.alarm < 25 ? SCORE.sneakBonusPerLevel : 0;
      game.lastBonus = SCORE.levelBonus + timeBonus + sneakBonus;
      game.score += game.lastBonus;
      if (game.levelIndex >= LEVELS.length - 1) {
        game.state = 'win';
        sfx.win();
      } else {
        game.state = 'levelclear';
        sfx.levelClear();
      }
    }
  }
}

function update(dt) {
  if (game.state === 'title') {
    if (input.wasPressed('enter')) { sfx.ensure(); loadLevel(0); game.score = 0; game.totalTime = 0; game.busts = 0; game.state = 'play'; }
    return;
  }
  if (game.state === 'play') {
    if (input.wasPressed('p', 'escape')) { game.state = 'paused'; return; }
    if (input.wasPressed('r')) { loadLevel(game.levelIndex); return; }
    if (input.wasPressed('m')) { sfx.toggleMute(); }
    updatePlay(dt);
    return;
  }
  if (game.state === 'paused') {
    if (input.wasPressed('p', 'escape', 'enter')) game.state = 'play';
    return;
  }
  if (game.state === 'busted') {
    if (input.wasPressed('r', 'enter')) { loadLevel(game.levelIndex); game.state = 'play'; }
    return;
  }
  if (game.state === 'levelclear') {
    if (input.wasPressed('enter')) { loadLevel(game.levelIndex + 1); game.state = 'play'; }
    return;
  }
  if (game.state === 'win') {
    if (input.wasPressed('enter')) { loadLevel(0); game.score = 0; game.totalTime = 0; game.busts = 0; game.state = 'play'; }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;
  // screenshot states (?shot=) are staged, not simulated: render only
  if (!params.has('shot')) {
    try {
      update(dt);
    } catch (err) {
      // never freeze on a logic error: show it in the title so a screenshot proves it
      console.error(err);
      document.title = 'GAME ERROR: ' + err.message;
    }
  }
  render(ctx, game);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Debug/test hook: the live state, so a headless play-test can read it.
window.__game = game;

window.addEventListener('error', (e) => { document.title = 'GAME ERROR: ' + e.message; });

// Boot: deterministic screenshot states via ?shot=start|play|end&seed=N
const params = new URLSearchParams(location.search);
loadLevel(0);
applyShot(game, params, { loadLevel });
if (!params.has('shot')) {
  // normal play starts on the title screen
  game.state = 'title';
}
requestAnimationFrame(frame);
