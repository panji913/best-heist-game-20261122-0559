// Vaultbreak — the three rooms of the heist. Walls are {x,y,w,h}; the play area
// starts below the HUD strip. Guards walk their waypoint loop; cameras sit on a
// wall and sweep. Loot has a name, a kind (drawn shape) and a value label.
import { HUD_H } from './config.js';

const WALL = (x, y, w, h) => ({ x, y, w, h });

export const LEVELS = [
  {
    name: 'LEVEL 1 — THE EMBER GALLERY',
    par: 75,
    spawn: { x: 90, y: 640 },
    exit: { x: 1150, y: 620, w: 64, h: 52 },
    walls: [
      WALL(0, HUD_H, 1280, 10), WALL(0, 700, 1280, 20), WALL(0, HUD_H, 10, 640), WALL(1270, HUD_H, 10, 640),
      WALL(300, 170, 220, 26), WALL(760, 170, 220, 26),
      WALL(300, 470, 26, 150), WALL(950, 330, 26, 150),
      WALL(560, 330, 160, 26),
    ],
    loot: [
      { x: 410, y: 300, kind: 'painting', name: 'Ember Portrait' },
      { x: 870, y: 300, kind: 'vase', name: 'Celadon Vase' },
      { x: 640, y: 590, kind: 'idol', name: 'Brass Idol' },
    ],
    guards: [
      { waypoints: [[330, 130], [950, 130], [950, 250], [330, 250]], speed: 62 },
      { waypoints: [[640, 430], [1130, 430], [1130, 620], [640, 620]], speed: 70 },
    ],
    cameras: [
      { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 0.9 },
    ],
  },
  {
    name: 'LEVEL 2 — THE VAULT HALL',
    par: 90,
    spawn: { x: 90, y: 150 },
    exit: { x: 90, y: 620, w: 64, h: 52 },
    walls: [
      WALL(0, HUD_H, 1280, 10), WALL(0, 700, 1280, 20), WALL(0, HUD_H, 10, 640), WALL(1270, HUD_H, 10, 640),
      WALL(220, 200, 26, 220), WALL(220, 200, 300, 26),
      WALL(760, 200, 26, 220), WALL(760, 200, 300, 26),
      WALL(520, 470, 240, 26), WALL(1040, 470, 26, 150),
      WALL(420, 560, 26, 140),
    ],
    loot: [
      { x: 370, y: 130, kind: 'painting', name: 'Moonlit Canal' },
      { x: 910, y: 130, kind: 'idol', name: 'Jade Idol' },
      { x: 640, y: 400, kind: 'gem', name: 'Star Sapphire' },
      { x: 1150, y: 300, kind: 'vase', name: 'Golden Urn' },
    ],
    guards: [
      { waypoints: [[330, 300], [330, 620], [700, 620], [700, 300]], speed: 72 },
      { waypoints: [[950, 130], [1200, 130], [1200, 420], [950, 420]], speed: 78 },
      { waypoints: [[150, 470], [420, 470], [420, 650], [150, 650]], speed: 66 },
    ],
    cameras: [
      { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 0.95 },
      { x: 1270, y: 380, baseAngle: Math.PI, sweep: 0.7 },
    ],
  },
  {
    name: 'LEVEL 3 — THE CROWN ROOM',
    par: 105,
    spawn: { x: 640, y: 640 },
    exit: { x: 1150, y: 110, w: 64, h: 52 },
    walls: [
      WALL(0, HUD_H, 1280, 10), WALL(0, 700, 1280, 20), WALL(0, HUD_H, 10, 640), WALL(1270, HUD_H, 10, 640),
      WALL(180, 180, 200, 26), WALL(900, 180, 200, 26),
      WALL(180, 510, 200, 26), WALL(900, 510, 200, 26),
      WALL(540, 260, 200, 26), WALL(540, 430, 200, 26),
      WALL(300, 300, 26, 130), WALL(954, 300, 26, 130),
    ],
    loot: [
      { x: 280, y: 130, kind: 'gem', name: 'Crown Jewel' },
      { x: 1000, y: 130, kind: 'painting', name: 'The Duchess' },
      { x: 640, y: 345, kind: 'idol', name: 'Obsidian Idol' },
      { x: 280, y: 620, kind: 'vase', name: 'Ruby Vase' },
      { x: 1000, y: 620, kind: 'gem', name: 'Black Opal' },
    ],
    guards: [
      { waypoints: [[150, 250], [480, 250], [480, 460], [150, 460]], speed: 82 },
      { waypoints: [[800, 250], [1130, 250], [1130, 460], [800, 460]], speed: 82 },
      { waypoints: [[640, 130], [640, 590]], speed: 90 },
    ],
    cameras: [
      { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 1.0 },
      { x: 10, y: 380, baseAngle: 0, sweep: 0.7 },
      { x: 1270, y: 380, baseAngle: Math.PI, sweep: 0.7 },
    ],
  },
];
