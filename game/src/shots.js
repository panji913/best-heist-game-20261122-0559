// Deterministic screenshot states: ?shot=start|play|end&seed=N
// The shots are real renders of the running game — each one sets up a genuine
// game state (title, mid-level, win) and lets the normal render loop draw it.
import { mulberry32 } from './random.js';

export function applyShot(game, params, hooks) {
  const shot = params.get('shot');
  if (!shot) return;
  const seed = Number(params.get('seed') || '1');
  const rng = mulberry32(seed * 7919 + 13);

  if (shot === 'start') {
    game.state = 'title';
    game.time = 1.2;
    return;
  }

  if (shot === 'play') {
    // Level 1, mid-heist: the thief is crossing the gallery, one loot already
    // pocketed, a coin on the floor, a guard mid-patrol with its cone sweeping
    // across the room, a camera sweeping, and the alarm part-way up.
    hooks.loadLevel(0);
    game.state = 'play';
    game.time = 6.5;
    game.player.x = 470; game.player.y = 430; game.player.sneaking = true;
    game.loot[0].taken = true;
    game.lootTaken = 1; game.lootLeft = 2;
    game.score = 500;
    game.levelTime = 24; game.totalTime = 24;
    game.alarm = 38;
    game.coinsLeft = 2;
    game.coins.push({ x: 700, y: 380 });
    // guards mid-patrol with cones facing the thief's lane
    game.guards[0].x = 640; game.guards[0].y = 190; game.guards[0].facing = Math.PI / 2;
    game.guards[0].wp = 1;
    game.guards[1].x = 900; game.guards[1].y = 520; game.guards[1].facing = Math.PI;
    game.guards[1].wp = 2;
    // camera sweeping down-left across the room
    game.cameras[0].phase = 0.6;
    game.cameras[0].angle = game.cameras[0].baseAngle + Math.sin(0.6) * game.cameras[0].sweep;
    // a little jitter from the seed so the shot is not a stock pose
    game.player.x += Math.floor(rng() * 10) - 5;
    return;
  }

  if (shot === 'end') {
    // Win screen after the third room: full loot, final score, clean run.
    hooks.loadLevel(2);
    game.state = 'win';
    game.time = 2.0;
    game.loot.forEach((l) => { l.taken = true; });
    game.lootTaken = 12; game.lootTotal = 12; game.lootLeft = 0;
    game.score = 12480;
    game.levelTime = 61; game.totalTime = 212;
    game.alarm = 12;
    game.busts = 0;
    return;
  }
}
