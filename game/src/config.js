// Vaultbreak — tuning constants. One place for every number the game plays by.
export const VIEW = { w: 1280, h: 720 };
export const HUD_H = 64; // top strip reserved for the alarm meter + HUD

export const PLAYER = {
  radius: 15,
  walkSpeed: 178,
  sneakSpeed: 92,
  grabRadius: 40,
  coinsPerLevel: 3,
};

export const GUARD = {
  radius: 16,
  patrolSpeed: 62,
  chaseSpeed: 138,
  investigateSpeed: 105,
  viewRange: 265,
  viewHalfAngle: 0.66, // ~38 degrees each side
  sneakRangeFactor: 0.58, // sneaking shrinks how far a guard can spot you
  spotRate: 46, // alarm points per second while a guard sees you
  spotRateSneak: 22,
  loseSightSeconds: 2.0,
};

export const CAMERA = {
  viewRange: 305,
  viewHalfAngle: 0.5,
  spotRate: 34,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 0.9, // radians each side of the base angle
};

export const ALARM = {
  decayPerSecond: 13,
  bustedAt: 100,
  warnAt: 60,
};

export const SCORE = {
  loot: 500,
  levelBonus: 1000,
  sneakBonusPerLevel: 250, // finishing a level with alarm under 25
  timeBonusPerSecond: 10, // up to 60s par per level
};
