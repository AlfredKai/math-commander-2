import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import { MathLogic } from '../utils/MathLogic';
import { ShipConfigs } from '../config/ShipConfig';

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
    this.gameStarted = false;
    this.enemies = [];
    this.targetEnemy = null;
    
    // UI
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'Inter, monospace',
      fontSize: '24px',
      color: '#00f2ff',
      fontStyle: 'bold'
    });

    // HTML UI Start Screen setup
    const startMenu = document.getElementById('start-menu');
    const volumeSlider = document.getElementById('enemy-volume');
    const volumeVal = document.getElementById('volume-val');
    const speedSlider = document.getElementById('enemy-speed');
    const speedVal = document.getElementById('speed-val');
    const startBtn = document.getElementById('start-btn');

    startMenu.classList.remove('hidden');

    // Update slider values dynamically
    volumeSlider.addEventListener('input', (e) => volumeVal.innerText = e.target.value);
    speedSlider.addEventListener('input', (e) => speedVal.innerText = e.target.value);

    const onStartClick = () => {
      startMenu.classList.add('hidden');
      const volume = parseInt(volumeSlider.value);
      const speed = parseFloat(speedSlider.value);
      
      // Clean up listeners
      startBtn.removeEventListener('click', onStartClick);
      
      this.startGame(volume, speed);
    };

    startBtn.addEventListener('click', onStartClick);

    // Select a random ship
    const shipKeys = Object.keys(ShipConfigs);
    // const randomShipKey = shipKeys[Phaser.Math.Between(0, shipKeys.length - 1)];
    const randomShipKey = 'ship-zero';

    // Player
    this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height - 150, randomShipKey);
    this.player.setVisible(false);

    // Effects layer
    this.effectsLayer = this.add.graphics();
  }

  startGame(volume = 4, speed = 0.6) {
    this.enemyVolume = volume;
    this.baseEnemySpeed = speed;
    this.gameStarted = true;
    this.player.setVisible(true);
    
    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  spawnEnemy() {
    if (this.enemies.length >= this.enemyVolume) return;
    
    const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
    const y = -50;
    const speed = this.baseEnemySpeed + (this.score / 1000);
    
    const enemy = new Enemy(this, x, y, speed);
    this.enemies.push(enemy);
  }

  lockOnEnemy(enemy) {
    if (this.targetEnemy) {
      // Clear previous lock
      this.targetEnemy.core.setFillStyle(0xff3d00);
    }
    
    this.targetEnemy = enemy;
    enemy.core.setFillStyle(0x00f2ff); // Highlight locked enemy
    
    this.player.setBatteryOptions(enemy.mathData.options, (selectedAnswer) => {
      this.fireLaser(selectedAnswer);
    });
  }

  fireLaser(selectedAnswer) {
    if (!this.targetEnemy) return;

    const isCorrect = selectedAnswer === this.targetEnemy.mathData.answer;
    const color = isCorrect ? 0x00f2ff : 0xff0000;
    const startX = this.player.x;
    const startY = this.player.y - 40;
    const endX = this.targetEnemy.x;
    const endY = this.targetEnemy.y;
    
    // Laser Graphics
    const laserGraphics = this.add.graphics();
    
    // Outer glow
    laserGraphics.lineStyle(16, color, 0.4);
    laserGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
    
    // Inner core
    laserGraphics.lineStyle(4, 0xffffff, 1);
    laserGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));

    // Animate laser fade out
    this.tweens.add({
      targets: laserGraphics,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => laserGraphics.destroy()
    });

    // Muzzle flash particles
    const muzzle = this.add.particles(startX, startY, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      tint: color,
      lifespan: 300,
      blendMode: 'ADD',
      emitting: false
    });
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
    });
    impact.explode(30);
    this.time.delayedCall(500, () => impact.destroy());

    if (isCorrect) {
      this.score += 10;
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      // Explosion shockwave
      const shockwave = this.add.circle(endX, endY, 10, color);
      shockwave.setStrokeStyle(4, color);
      shockwave.setFillStyle(); // Transparent center
      this.tweens.add({
        targets: shockwave,
        scale: 8,
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => shockwave.destroy()
      });

      this.destroyTarget();
    } else {
      this.score = Math.max(0, this.score - 2);
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      // Error shockwave
      const shockwave = this.add.circle(endX, endY, 10, color);
      this.tweens.add({
        targets: shockwave,
        scale: 4,
        alpha: 0,
        duration: 300,
        onComplete: () => shockwave.destroy()
      });

      // Shake screen
      this.cameras.main.shake(150, 0.015);
    }
  }

  destroyTarget() {
    if (!this.targetEnemy) return;
    
    const index = this.enemies.indexOf(this.targetEnemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
    
    this.targetEnemy.destroy();
    this.targetEnemy = null;
    this.player.resetBatteries();
  }

  update(time, delta) {
    if (!this.gameStarted) return;

    // Draw targeting line
    this.effectsLayer.clear();
    if (this.targetEnemy) {
      this.effectsLayer.lineStyle(2, 0x00f2ff, 0.5);
      
      // Dashed line effect manually by drawing small segments
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetEnemy.x, this.targetEnemy.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.targetEnemy.x, this.targetEnemy.y);
      
      const dashLength = 10;
      const gapLength = 10;
      let currentDist = 0;
      
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
      
      // Target reticle
      this.effectsLayer.strokeCircle(this.targetEnemy.x, this.targetEnemy.y, 45);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(time, delta);

      if (enemy.y > this.cameras.main.height + 50) {
        // Escaped
        if (this.targetEnemy === enemy) {
          this.targetEnemy = null;
          this.player.resetBatteries();
        }
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }
}
