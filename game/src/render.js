// Vaultbreak — all canvas drawing. One frame must show the room, the thief,
// guards with vision cones, cameras, the loot target and the alarm meter.
import { VIEW, HUD_H, ALARM } from './config.js';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLootShape(ctx, kind, x, y, t) {
  const bob = Math.sin(t * 2.4 + x) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.shadowColor = 'rgba(255, 210, 90, 0.9)';
  ctx.shadowBlur = 12;
  if (kind === 'painting') {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = '#e2703a';
    ctx.fillRect(-12, -8, 24, 16);
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'vase') {
    ctx.fillStyle = '#3fa7a0';
    ctx.beginPath();
    ctx.moveTo(-6, -14); ctx.quadraticCurveTo(-14, -2, -8, 10);
    ctx.quadraticCurveTo(0, 16, 8, 10); ctx.quadraticCurveTo(14, -2, 6, -14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7c948'; ctx.fillRect(-8, -16, 16, 4);
  } else if (kind === 'idol') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.arc(0, 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a017';
    ctx.beginPath(); ctx.arc(0, -8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1b26'; ctx.beginPath(); ctx.arc(-2, -9, 1.4, 0, Math.PI * 2); ctx.arc(2, -9, 1.4, 0, Math.PI * 2); ctx.fill();
  } else { // gem
    ctx.fillStyle = '#57c8ff';
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(12, -2); ctx.lineTo(0, 14); ctx.lineTo(-12, -2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(12, -2); ctx.stroke();
  }
  ctx.restore();
  // sparkle ring so loot reads at a glance
  ctx.strokeStyle = 'rgba(247, 201, 72, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y + bob, 20 + Math.sin(t * 3) * 2, 0, Math.PI * 2); ctx.stroke();
}

export function render(ctx, game) {
  const t = game.time;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);

  if (game.state === 'title') { drawTitle(ctx, game); return; }
  if (game.state === 'win') { drawRoom(ctx, game); drawHUD(ctx, game); drawWin(ctx, game); return; }

  drawRoom(ctx, game);
  drawHUD(ctx, game);

  if (game.state === 'busted') drawBusted(ctx, game);
  if (game.state === 'levelclear') drawLevelClear(ctx, game);
  if (game.state === 'paused') {
    ctx.fillStyle = 'rgba(5, 5, 12, 0.65)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.fillStyle = '#f5f0e1';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.w / 2, 350);
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Press P to resume', VIEW.w / 2, 392);
  }
}

function drawRoom(ctx, game) {
  const level = game.level;
  const t = game.time;
  // floor: dark parquet tiles
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(0, HUD_H, VIEW.w, VIEW.h - HUD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.w; x += 64) { ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, VIEW.h); ctx.stroke(); }
  for (let y = HUD_H; y <= VIEW.h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.w, y); ctx.stroke(); }
  // rug in the middle of the gallery
  ctx.fillStyle = 'rgba(122, 30, 40, 0.35)';
  ctx.fillRect(480, 300, 320, 140);
  ctx.strokeStyle = 'rgba(247, 201, 72, 0.35)';
  ctx.strokeRect(480, 300, 320, 140);

  // camera cones first (under guards), then guard cones
  for (const cam of game.cameras) {
    const alert = cam.seesPlayer;
    drawCone(ctx, cam.x, cam.y, cam.angle, cam.half, cam.range,
      alert ? 'rgba(255, 60, 60, 0.30)' : 'rgba(255, 90, 90, 0.16)',
      alert ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 90, 90, 0.35)');
  }
  for (const g of game.guards) {
    const alert = g.mode === 'chase';
    drawCone(ctx, g.x, g.y, g.facing, g.half, g.range,
      alert ? 'rgba(255, 70, 40, 0.34)' : 'rgba(247, 201, 72, 0.20)',
      alert ? 'rgba(255, 90, 50, 0.8)' : 'rgba(247, 201, 72, 0.45)');
  }

  // walls
  for (const w of level.walls) {
    ctx.fillStyle = '#33334a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4a4a66';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // exit door
  const ex = level.exit;
  const open = game.lootLeft === 0;
  ctx.fillStyle = open ? '#2e7d32' : '#5d4037';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = open ? '#7CFC9A' : '#8d6e63';
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT ◀' : 'LOCKED', ex.x + ex.w / 2, ex.y + ex.h / 2 + 5);
  if (open && Math.sin(t * 4) > 0) {
    ctx.strokeStyle = 'rgba(124, 252, 154, 0.8)';
    ctx.strokeRect(ex.x - 5, ex.y - 5, ex.w + 10, ex.h + 10);
  }

  // loot
  for (const loot of game.loot) {
    if (loot.taken) continue;
    drawLootShape(ctx, loot.kind, loot.x, loot.y, t);
    ctx.fillStyle = '#f5f0e1';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(loot.name, loot.x, loot.y + 34);
  }

  // tossed coins
  for (const c of game.coins) {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(247, 201, 72, 0.6)';
    ctx.beginPath(); ctx.arc(c.x, c.y, 9 + Math.sin(t * 5) * 2, 0, Math.PI * 2); ctx.stroke();
  }

  // cameras (wall mounts)
  for (const cam of game.cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.seesPlayer ? '#ff3b30' : '#8e8ea8';
    ctx.fillRect(-4, -5, 16, 10);
    ctx.fillStyle = '#2b2b3a';
    ctx.beginPath(); ctx.arc(12, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cam.seesPlayer ? '#ff6b60' : '#ff3b30';
    ctx.beginPath(); ctx.arc(12, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // guards
  for (const g of game.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = g.mode === 'chase' ? '#c0392b' : '#2e5fa3';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0d0d16'; ctx.lineWidth = 2; ctx.stroke();
    // cap + facing tick
    ctx.fillStyle = '#16233f';
    ctx.beginPath(); ctx.arc(0, -3, 9, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#f5f0e1'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(g.facing) * 20, Math.sin(g.facing) * 20); ctx.stroke();
    // alert mark
    if (g.mode === 'chase' || g.mode === 'investigate') {
      ctx.fillStyle = g.mode === 'chase' ? '#ff3b30' : '#f7c948';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.mode === 'chase' ? '!' : '?', 0, -24);
    }
    ctx.restore();
  }

  // the thief — Rook, in a dark hood with a pale mask band
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = p.sneaking ? 'rgba(20, 20, 30, 0.95)' : '#23232f';
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.sneaking ? '#7cfc9a' : '#f7c948';
  ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#f5f0e1';
  ctx.fillRect(-9, -4, 18, 6); // mask band
  ctx.fillStyle = '#14141d';
  ctx.beginPath(); ctx.arc(-4, -1, 1.8, 0, Math.PI * 2); ctx.arc(4, -1, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7c948';
  ctx.beginPath(); ctx.arc(0, 6, 3, 0, Math.PI * 2); ctx.fill(); // satchel clasp
  ctx.restore();

  // grab prompt
  const near = game.nearLoot;
  if (near && game.state === 'play') {
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Press E — grab the ${near.name}`, p.x, p.y - 28);
  }

  // coin hint when a coin is in flight / landed
  if (game.coins.length && game.state === 'play') {
    ctx.fillStyle = 'rgba(245, 240, 225, 0.75)';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('A guard heard the coin…', 16, VIEW.h - 14);
  }

  // soft vignette for the night mood (never hides the cones)
  const vg = ctx.createRadialGradient(640, 390, 300, 640, 390, 760);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, HUD_H, VIEW.w, VIEW.h - HUD_H);
}

function drawHUD(ctx, game) {
  // top strip
  ctx.fillStyle = '#0d0d16';
  ctx.fillRect(0, 0, VIEW.w, HUD_H);
  ctx.strokeStyle = 'rgba(247, 201, 72, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, HUD_H - 0.5); ctx.lineTo(VIEW.w, HUD_H - 0.5); ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('VAULTBREAK', 16, 24);
  ctx.fillStyle = '#b8b8cc';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(game.level.name, 16, 44);

  // alarm meter
  const ax = 330, ay = 16, aw = 340, ah = 20;
  const frac = game.alarm / ALARM.bustedAt;
  ctx.fillStyle = '#1c1c28';
  ctx.fillRect(ax, ay, aw, ah);
  const col = frac < 0.4 ? '#57c84d' : frac < ALARM.warnAt / 100 ? '#f7c948' : '#ff3b30';
  ctx.fillStyle = col;
  ctx.fillRect(ax, ay, aw * frac, ah);
  ctx.strokeStyle = '#f5f0e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('ALARM', ax, ay + ah + 15);
  ctx.fillText(`${Math.round(game.alarm)}%`, ax + aw + 10, ay + 15);
  if (game.alarm >= ALARM.warnAt && Math.sin(game.time * 6) > 0) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('! SPOTTED !', ax + aw + 62, ay + 15);
  }

  // right side stats
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`LOOT  ${game.lootTaken}/${game.lootTotal}    COINS  ${game.coinsLeft}    SCORE  ${game.score}`, VIEW.w - 16, 24);
  ctx.fillStyle = '#b8b8cc';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`TIME ${Math.floor(game.levelTime)}s  ·  WASD move · SHIFT sneak · CLICK coin · E grab · P pause · M mute`, VIEW.w - 16, 44);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = '#0d0d16';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // moon + skyline silhouette
  ctx.fillStyle = '#f7c948';
  ctx.beginPath(); ctx.arc(1060, 110, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a26';
  for (let i = 0; i < 12; i++) {
    const bx = 40 + i * 104, bh = 90 + ((i * 37) % 130);
    ctx.fillRect(bx, 620 - bh, 70, bh);
    ctx.fillStyle = 'rgba(247, 201, 72, 0.5)';
    for (let wnd = 0; wnd < 4; wnd++) ctx.fillRect(bx + 10 + wnd * 15, 620 - bh + 16, 8, 10);
    ctx.fillStyle = '#1a1a26';
  }
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULTBREAK', VIEW.w / 2, 210);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('— The Midnight Gallery Heist —', VIEW.w / 2, 252);
  ctx.font = '17px Georgia, serif';
  const lines = [
    'You are Rook, a thief with one night, three rooms and a very loud alarm.',
    'Slip past the guards and their vision cones, dodge the sweeping cameras,',
    'grab every piece of loot, then reach the green EXIT before the alarm hits 100%.',
    '',
    'WASD / arrows — move      SHIFT — sneak (slower, harder to spot)',
    'MOUSE CLICK — toss a coin to lure a guard      E — grab loot',
    'P — pause      M — mute      R — restart the room',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW.w / 2, 310 + i * 26));
  if (Math.sin(game.time * 3) > -0.2) {
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Press ENTER to begin the heist', VIEW.w / 2, 560);
  }
  ctx.fillStyle = '#8e8ea8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('An original game — no borrowed art, music or names. Best played in desktop Chrome.', VIEW.w / 2, 610);
}

function drawBusted(ctx, game) {
  ctx.fillStyle = 'rgba(10, 0, 0, 0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#ff3b30';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('BUSTED!', VIEW.w / 2, 330);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '19px Georgia, serif';
  ctx.fillText('The alarm hit 100% — the gallery is crawling with security.', VIEW.w / 2, 372);
  ctx.fillText(`Score so far: ${game.score}   ·   Loot kept: ${game.lootTaken}/${game.lootTotal}`, VIEW.w / 2, 402);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press R to retry this room', VIEW.w / 2, 452);
}

function drawLevelClear(ctx, game) {
  ctx.fillStyle = 'rgba(5, 12, 5, 0.66)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#7cfc9a';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', VIEW.w / 2, 320);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Room cleared — loot ${game.lootTaken}/${game.lootTotal}  ·  bonus +${game.lastBonus}`, VIEW.w / 2, 362);
  ctx.fillText(`Total score: ${game.score}`, VIEW.w / 2, 392);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER for the next room', VIEW.w / 2, 442);
}

function drawWin(ctx, game) {
  ctx.fillStyle = 'rgba(5, 8, 5, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE PERFECT HEIST', VIEW.w / 2, 300);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Three rooms. Every jewel. Not a single alarm that mattered.', VIEW.w / 2, 344);
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillStyle = '#7cfc9a';
  ctx.fillText(`FINAL SCORE  ${game.score}`, VIEW.w / 2, 396);
  ctx.fillStyle = '#b8b8cc';
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`Loot ${game.lootTaken}/${game.lootTotal}  ·  Time ${Math.floor(game.totalTime)}s  ·  Times busted: ${game.busts}`, VIEW.w / 2, 430);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER to run it all again', VIEW.w / 2, 486);
}
