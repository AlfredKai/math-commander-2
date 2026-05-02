import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import { MathLogic } from '../utils/MathLogic';
import { ShipConfigs } from '../config/ShipConfig';

// ─── Layer Depths ────────────────────────────────────────────────────────────
// Higher value = rendered on top.
const DEPTH = {
  GAMEPLAY: 0,   // enemies, lock line, laser effects
  PLAYER:   10,  // player ship + batteries
  UI:       20,  // score text and HUD
};

const MAX_HULL = 5; // Hull points the ship starts with

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
    
    this.score = 0;
    this.hull  = MAX_HULL;
    this.winScore = 100;
    this.gameStarted = false;
    this.gameOver = false;
    this.enemies = [];
    this.targetEnemy = null;
    
    // ── Score HUD ──
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'Inter, monospace',
      fontSize: '24px',
      color: '#00f2ff',
      fontStyle: 'bold'
    }).setDepth(DEPTH.UI);

    // ── Hull HUD ──
    this.hullText = this.add.text(20, 54, `HULL: ${this._hullBar()}`, {
      fontFamily: 'Inter, monospace',
      fontSize: '20px',
      color: '#ff9f43',
      fontStyle: 'bold'
    }).setDepth(DEPTH.UI);

    // ── Win-score HUD (top-right) ──
    this.winText = this.add.text(
      this.cameras.main.width - 20, 20,
      `WIN AT: ${this.winScore}`,
      {
        fontFamily: 'Inter, monospace',
        fontSize: '18px',
        color: '#a0d8ef',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0).setDepth(DEPTH.UI);

    // ── HTML UI Start Screen ──
    const startMenu   = document.getElementById('start-menu');
    const volumeSlider = document.getElementById('enemy-volume');
    const volumeVal    = document.getElementById('volume-val');
    const speedSlider  = document.getElementById('enemy-speed');
    const speedVal     = document.getElementById('speed-val');
    const winSlider    = document.getElementById('win-score');
    const winScoreVal  = document.getElementById('win-score-val');
    const startBtn     = document.getElementById('start-btn');
    const endScreen    = document.getElementById('end-screen');
    const playAgainBtn = document.getElementById('play-again-btn');

    startMenu.classList.remove('hidden');

    volumeSlider.addEventListener('input', (e) => volumeVal.innerText = e.target.value);
    speedSlider.addEventListener('input',  (e) => speedVal.innerText  = e.target.value);
    winSlider.addEventListener('input',    (e) => winScoreVal.innerText = e.target.value);

    const onStartClick = () => {
      startMenu.classList.add('hidden');
      const volume   = parseInt(volumeSlider.value);
      const speed    = parseFloat(speedSlider.value);
      const winScore = parseInt(winSlider.value);
      startBtn.removeEventListener('click', onStartClick);
      this.startGame(volume, speed, winScore);
    };
    startBtn.addEventListener('click', onStartClick);

    // Play Again — restart the entire scene
    playAgainBtn.addEventListener('click', () => {
      endScreen.classList.add('hidden');
      startMenu.classList.remove('hidden');

      // Reset sliders to current values (keep player preferences)
      volumeVal.innerText   = volumeSlider.value;
      speedVal.innerText    = speedSlider.value;
      winScoreVal.innerText = winSlider.value;

      this.scene.restart();
    });

    // Select a random ship
    const shipKeys = Object.keys(ShipConfigs);
    // const randomShipKey = shipKeys[Phaser.Math.Between(0, shipKeys.length - 1)];
    const randomShipKey = 'ship-zero';

    this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height - 150, randomShipKey);
    this.player.setDepth(DEPTH.PLAYER);
    this.player.setVisible(false);

    // Effects layer (lock line) — gameplay depth
    this.effectsLayer = this.add.graphics().setDepth(DEPTH.GAMEPLAY);
  }

  // ─── Hull display helper ──────────────────────────────────────────────────
  _hullBar() {
    const filled = '█'.repeat(this.hull);
    const empty  = '░'.repeat(MAX_HULL - this.hull);
    return filled + empty;
  }

  _refreshHullText() {
    this.hullText.setText(`HULL: ${this._hullBar()}`);
    // Tint red as hull drops
    const ratio = this.hull / MAX_HULL;
    if (ratio > 0.6)      this.hullText.setColor('#ff9f43');
    else if (ratio > 0.3) this.hullText.setColor('#ff6b6b');
    else                  this.hullText.setColor('#ff3d00');
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  startGame(volume = 4, speed = 0.6, winScore = 100) {
    this.enemyVolume   = volume;
    this.baseEnemySpeed = speed;
    this.winScore      = winScore;
    this.gameStarted   = true;
    this.player.setVisible(true);

    this.winText.setText(`WIN AT: ${this.winScore}`);
    
    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  // ─── Spawn ────────────────────────────────────────────────────────────────
  spawnEnemy() {
    if (this.gameOver) return;
    if (this.enemies.length >= this.enemyVolume) return;
    
    const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
    const y = -50;
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
    if (!this.targetEnemy || this.gameOver) return;

    const isCorrect = selectedAnswer === this.targetEnemy.mathData.answer;
    const color  = isCorrect ? 0x00f2ff : 0xff0000;
    const startX = this.player.x;
    const startY = this.player.y - 40;
    const endX   = this.targetEnemy.x;
    const endY   = this.targetEnemy.y;
    
    // Laser Graphics
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
      tint: color,
      lifespan: 300,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(DEPTH.GAMEPLAY);
    muzzle.explode(10);
    this.time.delayedCall(400, () => muzzle.destroy());

    // Impact particles
    const impact = this.add.particles(endX, endY, 'particle', {
      speed: { min: 100, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      tint: color,
      lifespan: 400,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(DEPTH.GAMEPLAY);
    impact.explode(30);
    this.time.delayedCall(500, () => impact.destroy());

    if (isCorrect) {
      this.score += 10;
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      // Explosion shockwave
      const shockwave = this.add.circle(endX, endY, 10, color);
      shockwave.setDepth(DEPTH.GAMEPLAY);
      shockwave.setStrokeStyle(4, color);
      shockwave.setFillStyle();
      this.tweens.add({
        targets: shockwave,
        scale: 8,
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => shockwave.destroy()
      });

      this.destroyTarget();

      // Check win
      if (this.score >= this.winScore) {
        this.endGame(true);
      }
    } else {
      this.score = Math.max(0, this.score - 2);
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      // Error shockwave
      const shockwave = this.add.circle(endX, endY, 10, color);
      shockwave.setDepth(DEPTH.GAMEPLAY);
      this.tweens.add({
        targets: shockwave,
        scale: 4,
        alpha: 0,
        duration: 300,
        onComplete: () => shockwave.destroy()
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

    // Red flash on hull damage
    this.cameras.main.flash(300, 255, 30, 30);
    this.cameras.main.shake(200, 0.02);

    if (this.hull <= 0) {
      this.endGame(false);
    }
  }

  // ─── End game ─────────────────────────────────────────────────────────────
  endGame(didWin) {
    if (this.gameOver) return;
    this.gameOver = true;

    // Stop spawning
    if (this.spawnTimer) this.spawnTimer.remove();

    // Pause all enemy movement
    this.enemies.forEach(e => e.setActive(false));

    const endScreen  = document.getElementById('end-screen');
    const endTitle   = document.getElementById('end-title');
    const endSubtitle = document.getElementById('end-subtitle');
    const endScore   = document.getElementById('end-score');

    if (didWin) {
      endTitle.textContent = 'VICTORY';
      endTitle.className   = 'win';
      endSubtitle.textContent = 'Target score reached. Mission accomplished!';
    } else {
      endTitle.textContent = 'HULL BREACH';
      endTitle.className   = 'lose';
      endSubtitle.textContent = 'Too many enemies broke through. Ship destroyed.';
    }
    endScore.textContent = `Final Score: ${this.score}`;

    endScreen.classList.remove('hidden');
  }

  // ─── Update loop ──────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.gameStarted || this.gameOver) return;

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
        const startX = this.player.x + Math.cos(angle) * currentDist;
        const startY = this.player.y + Math.sin(angle) * currentDist;
        this.effectsLayer.moveTo(startX, startY);
        
        currentDist += dashLength;
        if (currentDist > dist) currentDist = dist;
        
        const endX = this.player.x + Math.cos(angle) * currentDist;
        const endY = this.player.y + Math.sin(angle) * currentDist;
        this.effectsLayer.lineTo(endX, endY);
        
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
        // Enemy escaped → hull damage
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
