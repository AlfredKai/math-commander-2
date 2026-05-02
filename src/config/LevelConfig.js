/**
 * LevelConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Add or edit levels here. Each object becomes one selectable level card on
 * the start screen. No other file needs to change for level additions.
 *
 * Fields:
 *   id          – unique string key
 *   name        – display name shown on the card
 *   subtitle    – short flavour text shown below the name
 *   enemyVolume – max enemies on screen at once
 *   enemySpeed  – base downward speed of enemies (pixels/tick-ish)
 *   spawnDelay  – milliseconds between spawn attempts
 *   winScore    – score required to win
 *   maxHull     – hull points the ship starts with
 *   color       – accent hex colour for the card border/glow
 */
export const LevelConfigs = [
  {
    id:          'level-1',
    name:        'SECTOR 1',
    subtitle:    'Patrol duty. Light resistance.',
    enemyVolume: 3,
    enemySpeed:  0.5,
    spawnDelay:  2500,
    winScore:    60,
    maxHull:     5,
    color:       '#00f2ff',   // cyan
  },
  {
    id:          'level-2',
    name:        'SECTOR 2',
    subtitle:    'Hostile contact. Stay sharp.',
    enemyVolume: 5,
    enemySpeed:  0.9,
    spawnDelay:  1800,
    winScore:    120,
    maxHull:     4,
    color:       '#ffd32a',   // amber
  },
  {
    id:          'level-3',
    name:        'SECTOR 3',
    subtitle:    'Full assault. No mercy.',
    enemyVolume: 8,
    enemySpeed:  1.4,
    spawnDelay:  1200,
    winScore:    200,
    maxHull:     3,
    color:       '#ff3d00',   // red-orange
  },
];
