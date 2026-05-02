import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import { MathLogic } from '../utils/MathLogic';
import { ShipConfigs } from '../config/ShipConfig';
import { LevelConfigs } from '../config/LevelConfig';

// ─── Layer Depths ────────────────────────────────────────────────────────────
const DEPTH = {
  GAMEPLAY: 0,   // enemies, lock line, laser effects
  PLAYER:   10,  // player ship + batteries
  UI:       20,  // score text and HUD
};

// How long (ms) the level-complete screen is shown before advancing
const LEVEL_TRANSITION_MS = 2500;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    Object.values(ShipConfigs).forEach(config => {
      this.load.image(config.assetKey, config.assetPath);
    });
  }

  create() {
    // Generate particle texture for effects
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);

    this.mathLogic = MathLogic;

    // ── Runtime state ──────────────────────────────────────────────────────
    this.score            = 0;
    this.hull             = 0;
    this.maxHull          = 0;
    this.winScore         = 0;
    this.currentLevelIdx  = 0;
    this.gameStarted      = false;
    this.gameOver         = false;
    this.transitioning    = false;  // true while level-complete overlay is showing
    this.enemies          = [];
    this.targetEnemy      = null;

    // ── HUD ───────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'Inter, monospace',
      fontSize: '24px',
      color: '#00f2ff',
      fontStyle: 'bold'
    }).setDepth(DEPTH.UI);

    this.hullText = this.add.text(20, 54, '', {
      fontFamily: 'Inter, monospace',
      fontSize: '20px',
      color: '#ff9f43',
      fontStyle: 'bold'
    }).setDepth(DEPTH.UI);

    this.levelLabel = this.add.text(
      this.cameras.main.width - 20, 20, '',
      {
        fontFamily: 'Inter, monospace',
        fontSize: '18px',
        color: '#a0d8ef',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0).setDepth(DEPTH.UI);

    this.winText = this.add.text(
      this.cameras.main.width - 20, 46, '',
      {
        fontFamily: 'Inter, monospace',
        fontSize: '16px',
        color: '#607d8b',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0).setDepth(DEPTH.UI);

    // ── HTML references ────────────────────────────────────────────────────
    const startMenu    = document.getElementById('start-menu');
    const startBtn     = document.getElementById('start-btn');
    const endScreen    = document.getElementById('end-screen');
    const playAgainBtn = document.getElementById('play-again-btn');

    startMenu.classList.remove('hidden');

    const onStartClick = () => {
      startMenu.classList.add('hidden');
      startBtn.removeEventListener('click', onStartClick);
      this.loadLevel(0);
    };
    startBtn.addEventListener('click', onStartClick);

    playAgainBtn.addEventListener('click', () => {
      endScreen.classList.add('hidden');
      this.scene.restart();
    });

    // ── Player ────────────────────────────────────────────────────────────
    const randomShipKey = 'ship-zero';
    this.player = new Player(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height - 150,
      randomShipKey
    );
    this.player.setDepth(DEPTH.PLAYER);
    this.player.setVisible(false);

    // Effects layer (lock line)
    this.effectsLayer = this.add.graphics().setDepth(DEPTH.GAMEPLAY);
  }

  // ─── Load a level by index ────────────────────────────────────────────────
  loadLevel(idx) {
    const lvl = LevelConfigs[idx];
    if (!lvl) return; // safety guard

    this.currentLevelIdx = idx;

    // Apply level settings
    this.enemyVolume    = lvl.enemyVolume;
    this.baseEnemySpeed = lvl.enemySpeed;
    this.winScore       = lvl.winScore;
    this.maxHull        = lvl.maxHull;
    this.hull           = lvl.maxHull;
    this.score          = 0;           // score resets each level
    this.gameOver       = false;
    this.transitioning  = false;

    // Update HUD
    this.scoreText.setText('SCORE: 0');
    this._refreshHullText();
    this.levelLabel.setText(lvl.name);
    this.winText.setText(`WIN AT: ${lvl.winScore}`);

    this.player.setVisible(true);
    this.gameStarted = true;

    // Clear any leftover enemies from previous level
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.targetEnemy = null;
    this.player.resetBatteries();

    // Stop old timer and start a new one for this level's spawn rate
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: lvl.spawnDelay,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  // ─── Hull helpers ─────────────────────────────────────────────────────────
  _hullBar() {
    const filled = '█'.repeat(this.hull);
    const empty  = '░'.repeat(this.maxHull - this.hull);
    return filled + empty;
  }

  _refreshHullText() {
    this.hullText.setText(`HULL: ${this._hullBar()}`);
    const ratio = this.hull / this.maxHull;
    if (ratio > 0.6)      this.hullText.setColor('#ff9f43');
    else if (ratio > 0.3) this.hullText.setColor('#ff6b6b');
    else                  this.hullText.setColor('#ff3d00');
  }

  // ─── Spawn ────────────────────────────────────────────────────────────────
  spawnEnemy() {
    if (this.gameOver || this.transitioning) return;
    if (this.enemies.length >= this.enemyVolume) return;

    const x     = Phaser.Math.Between(100, this.cameras.main.width - 100);
    const y     = -50;
    const speed = this.baseEnemySpeed + (this.score / 1000);

    const enemy = new Enemy(this, x, y, speed);
    this.enemies.push(enemy);
  }

  // ─── Lock-on ──────────────────────────────────────────────────────────────
  lockOnEnemy(enemy) {
    if (this.targetEnemy) {
      this.targetEnemy.core.setFillStyle(0xff3d00);
    }
    this.targetEnemy = enemy;
    enemy.core.setFillStyle(0x00f2ff);

    this.player.setBatteryOptions(enemy.mathData.options, (selectedAnswer) => {
      this.fireLaser(selectedAnswer);
    });
  }

  // ─── Fire ─────────────────────────────────────────────────────────────────
  fireLaser(selectedAnswer) {
    if (!this.targetEnemy || this.gameOver || this.transitioning) return;

    const isCorrect = selectedAnswer === this.targetEnemy.mathData.answer;
    const color  = isCorrect ? 0x00f2ff : 0xff0000;
    const startX = this.player.x;
    const startY = this.player.y - 40;
    const endX   = this.targetEnemy.x;
    const endY   = this.targetEnemy.y;

    // Laser beam
    const laserGraphics = this.add.graphics().setDepth(DEPTH.GAMEPLAY);
    laserGraphics.lineStyle(16, color, 0.4);
    laserGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
    laserGraphics.lineStyle(4, 0xffffff, 1);
    laserGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
    this.tweens.add({
      targets: laserGraphics,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => laserGraphics.destroy()
    });

    // Muzzle flash
    const muzzle = this.add.particles(startX, startY, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      tint: color, lifespan: 300, blendMode: 'ADD', emitting: false
    }).setDepth(DEPTH.GAMEPLAY);
    muzzle.explode(10);
    this.time.delayedCall(400, () => muzzle.destroy());

    // Impact
    const impact = this.add.particles(endX, endY, 'particle', {
      speed: { min: 100, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      tint: color, lifespan: 400, blendMode: 'ADD', emitting: false
    }).setDepth(DEPTH.GAMEPLAY);
    impact.explode(30);
    this.time.delayedCall(500, () => impact.destroy());

    if (isCorrect) {
      this.score += 10;
      this.scoreText.setText(`SCORE: ${this.score}`);

      // Shockwave
      const sw = this.add.circle(endX, endY, 10, color).setDepth(DEPTH.GAMEPLAY);
      sw.setStrokeStyle(4, color);
      sw.setFillStyle();
      this.tweens.add({
        targets: sw, scale: 8, alpha: 0, duration: 400,
        ease: 'Cubic.easeOut', onComplete: () => sw.destroy()
      });

      this.destroyTarget();

      if (this.score >= this.winScore) {
        this._levelComplete();
      }
    } else {
      this.score = Math.max(0, this.score - 2);
      this.scoreText.setText(`SCORE: ${this.score}`);

      const sw = this.add.circle(endX, endY, 10, color).setDepth(DEPTH.GAMEPLAY);
      this.tweens.add({
        targets: sw, scale: 4, alpha: 0, duration: 300,
        onComplete: () => sw.destroy()
      });
      this.cameras.main.shake(150, 0.015);
    }
  }

  // ─── Destroy target ───────────────────────────────────────────────────────
  destroyTarget() {
    if (!this.targetEnemy) return;
    const index = this.enemies.indexOf(this.targetEnemy);
    if (index > -1) this.enemies.splice(index, 1);
    this.targetEnemy.destroy();
    this.targetEnemy = null;
    this.player.resetBatteries();
  }

  // ─── Hull damage ──────────────────────────────────────────────────────────
  damageHull(amount = 1) {
    this.hull = Math.max(0, this.hull - amount);
    this._refreshHullText();
    this.cameras.main.flash(300, 255, 30, 30);
    this.cameras.main.shake(200, 0.02);
    if (this.hull <= 0) {
      this._endGame(false);
    }
  }

  // ─── Level complete → advance or final victory ────────────────────────────
  _levelComplete() {
    this.transitioning = true;
    if (this.spawnTimer) this.spawnTimer.remove();

    const isLastLevel  = this.currentLevelIdx >= LevelConfigs.length - 1;
    const nextLvl      = LevelConfigs[this.currentLevelIdx + 1];

    const lcEl    = document.getElementById('level-complete');
    const lcName  = document.getElementById('lc-name');
    const lcNext  = document.getElementById('lc-next');
    const lcFill  = document.getElementById('lc-bar-fill');

    lcName.textContent = LevelConfigs[this.currentLevelIdx].name;

    if (isLastLevel) {
      lcNext.textContent = 'All sectors secured.';
    } else {
      lcNext.textContent = `Advancing to ${nextLvl.name}…`;
    }

    // Restart the CSS animation on the drain bar
    lcFill.style.setProperty('--lc-duration', `${LEVEL_TRANSITION_MS}ms`);
    lcFill.style.animation = 'none';
    // Force reflow so the animation restart takes effect
    void lcFill.offsetWidth;
    lcFill.style.animation = '';

    lcEl.classList.remove('hidden');

    this.time.delayedCall(LEVEL_TRANSITION_MS, () => {
      lcEl.classList.add('hidden');
      if (isLastLevel) {
        this._endGame(true);
      } else {
        this.loadLevel(this.currentLevelIdx + 1);
      }
    });
  }

  // ─── End game (win all / hull breach) ────────────────────────────────────
  _endGame(didWin) {
    if (this.gameOver) return;
    this.gameOver    = true;
    this.gameStarted = false;
    if (this.spawnTimer) this.spawnTimer.remove();
    this.enemies.forEach(e => e.setActive(false));

    const endScreen   = document.getElementById('end-screen');
    const endTitle    = document.getElementById('end-title');
    const endSubtitle = document.getElementById('end-subtitle');
    const endScore    = document.getElementById('end-score');

    if (didWin) {
      endTitle.textContent    = 'VICTORY';
      endTitle.className      = 'win';
      endSubtitle.textContent = 'All sectors cleared. Mission accomplished!';
    } else {
      endTitle.textContent    = 'HULL BREACH';
      endTitle.className      = 'lose';
      endSubtitle.textContent = `Fell at ${LevelConfigs[this.currentLevelIdx]?.name ?? 'SECTOR'}. Ship destroyed.`;
    }
    endScore.textContent = `Final Score: ${this.score}`;
    endScreen.classList.remove('hidden');
  }

  // ─── Update loop ──────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.gameStarted || this.gameOver || this.transitioning) return;

    // Draw targeting line
    this.effectsLayer.clear();
    if (this.targetEnemy) {
      this.effectsLayer.lineStyle(2, 0x00f2ff, 0.5);

      const dist  = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetEnemy.x, this.targetEnemy.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.targetEnemy.x, this.targetEnemy.y);
      const dashLength = 10;
      const gapLength  = 10;
      let currentDist  = 0;

      this.effectsLayer.beginPath();
      while (currentDist < dist) {
        const sx = this.player.x + Math.cos(angle) * currentDist;
        const sy = this.player.y + Math.sin(angle) * currentDist;
        this.effectsLayer.moveTo(sx, sy);

        currentDist += dashLength;
        if (currentDist > dist) currentDist = dist;

        const ex = this.player.x + Math.cos(angle) * currentDist;
        const ey = this.player.y + Math.sin(angle) * currentDist;
        this.effectsLayer.lineTo(ex, ey);

        currentDist += gapLength;
      }
      this.effectsLayer.strokePath();
      this.effectsLayer.strokeCircle(this.targetEnemy.x, this.targetEnemy.y, 45);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(time, delta);

      if (enemy.y > this.cameras.main.height + 50) {
        if (this.targetEnemy === enemy) {
          this.targetEnemy = null;
          this.player.resetBatteries();
        }
        enemy.destroy();
        this.enemies.splice(i, 1);
        this.damageHull(1);
      }
    }
  }
}
