import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    
    // Ship visuals
    this.graphics = scene.add.graphics();
    
    // Hull
    this.graphics.fillStyle(0xcccccc, 1);
    this.graphics.lineStyle(2, 0x00f2ff, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(0, -40);
    this.graphics.lineTo(30, 20);
    this.graphics.lineTo(0, 10);
    this.graphics.lineTo(-30, 20);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
    
    // Thrusters
    this.thrusterCore = scene.add.triangle(0, 25, 0, 0, -10, -20, 10, -20, 0x00f2ff);
    this.thrusterCore.setAngle(180);
    
    scene.tweens.add({
      targets: this.thrusterCore,
      scaleY: 1.5,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
      repeat: -1
    });

    this.add([this.thrusterCore, this.graphics]);

    // Batteries
    this.batteries = [];
    const batteryOffsets = [-80, 0, 80];
    
    for (let i = 0; i < 3; i++) {
      const bx = batteryOffsets[i];
      const by = 50;
      
      const bContainer = scene.add.container(bx, by);
      
      const bg = scene.add.circle(0, 0, 25, 0x000000);
      bg.setStrokeStyle(2, 0x333333);
      
      const text = scene.add.text(0, 0, '', {
        fontFamily: 'Inter, monospace',
        fontSize: '24px',
        color: '#555555',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      bContainer.add([bg, text]);
      bContainer.bg = bg;
      bContainer.text = text;
      
      bContainer.setSize(50, 50);
      
      this.batteries.push(bContainer);
      this.add(bContainer);
    }

    scene.add.existing(this);
  }

  setBatteryOptions(options, callback) {
    this.batteries.forEach((battery, index) => {
      battery.text.setText(options[index]);
      battery.text.setColor('#00f2ff');
      battery.bg.setStrokeStyle(2, 0x00f2ff);
      
      battery.setInteractive({ useHandCursor: true });
      battery.removeAllListeners('pointerdown');
      battery.on('pointerdown', () => {
        callback(options[index]);
      });
    });
  }

  resetBatteries() {
    this.batteries.forEach(battery => {
      battery.text.setText('');
      battery.bg.setStrokeStyle(2, 0x333333);
      battery.disableInteractive();
      battery.removeAllListeners('pointerdown');
    });
  }
}
