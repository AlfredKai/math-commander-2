import Phaser from 'phaser';
import { ShipConfigs } from '../config/ShipConfig';
export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, shipKey = 'ship-zero') {
    super(scene, x, y);

    this.scene = scene;

    const config = ShipConfigs[shipKey] || ShipConfigs['ship-zero'];

    // Ship visuals
    this.shipSprite = scene.add.sprite(0, 0, config.assetKey);

    // Scale image to a reasonable ship size
    this.shipSprite.setDisplaySize(120, 120);

    // Thrusters
    this.thrusters = [];
    config.thrusters.forEach(tConf => {
      const thruster = scene.add.particles(tConf.x, tConf.y, 'particle', {
        speed: tConf.speed,
        angle: tConf.angle,
        scale: tConf.scale,
        alpha: { start: 1, end: 0 },
        tint: tConf.tint,
        lifespan: 300,
        blendMode: 'ADD'
      });
      this.thrusters.push(thruster);
    });

    // Add emitters first so they render under the ship
    this.add([...this.thrusters, this.shipSprite]);

    // Animate ship sprite and thrusters (hovering effect)
    scene.tweens.add({
      targets: [this.shipSprite, ...this.thrusters],
      y: '-=10',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Batteries
    this.batteries = [];
    const batteryOffsets = [-100, 0, 100];
    this.batteryRadius = 25;

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

  getHorizontalPadding() {
    const shipHalfWidth = this.shipSprite.displayWidth / 2;
    const batteryReach = Math.max(...this.batteries.map((battery) => {
      return Math.abs(battery.x) + this.batteryRadius;
    }));

    return Math.ceil(Math.max(shipHalfWidth, batteryReach) + 16);
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
