import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    
    // Ship visuals
    this.shipSprite = scene.add.sprite(0, 0, 'hero');
    
    // Scale image to a reasonable ship size
    this.shipSprite.setDisplaySize(120, 120);

    // Left Thruster
    this.leftThruster = scene.add.particles(-25, 55, 'particle', {
      speed: { min: 80, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x00f2ff,
      lifespan: 300,
      blendMode: 'ADD'
    });

    // Right Thruster
    this.rightThruster = scene.add.particles(25, 55, 'particle', {
      speed: { min: 80, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x00f2ff,
      lifespan: 300,
      blendMode: 'ADD'
    });

    // Add emitters first so they render under the ship
    this.add([this.leftThruster, this.rightThruster, this.shipSprite]);

    // Animate ship sprite and thrusters (hovering effect)
    scene.tweens.add({
      targets: [this.shipSprite, this.leftThruster, this.rightThruster],
      y: '-=10',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Batteries
    this.batteries = [];
    const batteryOffsets = [-100, 0, 100];
    
    for (let i = 0; i < 3; i++) {
      const bx = batteryOffsets[i];
      const by = 100; // Increased from 80 for a larger gap
      
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
