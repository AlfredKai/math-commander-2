import Phaser from 'phaser';
import './style.css';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: Math.min(800, window.innerWidth),
  height: window.innerHeight,
  backgroundColor: '#000510',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
