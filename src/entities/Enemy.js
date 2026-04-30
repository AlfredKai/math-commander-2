import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, speed) {
    super(scene, x, y);

    this.scene = scene;
    this.speed = speed;
    
    // Math logic
    this.mathData = scene.mathLogic.generateProblem();
    
    // Visuals
    // Hexagonal drone
    this.graphics = scene.add.graphics();
    this.graphics.lineStyle(2, 0xff3d00, 1);
    this.graphics.fillStyle(0x000000, 0.8);
    
    // Draw hexagon
    this.drawHexagon(0, 0, 30);
    
    // Inner core
    this.core = scene.add.circle(0, 0, 10, 0xff3d00);
    
    // Text
    this.text = scene.add.text(0, 45, this.mathData.questionString, {
      fontFamily: 'Inter, monospace',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add([this.graphics, this.core, this.text]);
    
    // Animations
    scene.tweens.add({
      targets: this.graphics,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });

    scene.tweens.add({
      targets: this.core,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Interaction
    this.setSize(80, 80);
    this.setInteractive({ useHandCursor: true });
    
    this.on('pointerdown', () => {
      scene.lockOnEnemy(this);
    });

    scene.add.existing(this);
  }

  drawHexagon(x, y, radius) {
    this.graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) this.graphics.moveTo(px, py);
      else this.graphics.lineTo(px, py);
    }
    this.graphics.closePath();
    this.graphics.strokePath();
    this.graphics.fillPath();
  }

  update(time, delta) {
    this.y += this.speed * (delta / 16);
  }
}
