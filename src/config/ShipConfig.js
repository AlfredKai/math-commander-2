import shipZeroImg from '../assets/ship-zero-n.png';
import ship1Img from '../assets/ship1.png';
import simpleSpaceshipImg from '../assets/simple_spaceship.png';
import spaceshipImg from '../assets/spaceship.png';

export const ShipConfigs = {
  'ship-zero': {
    assetKey: 'ship-zero',
    assetPath: shipZeroImg,
    thrusters: [
      { x: -25, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
      { x: -15, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
      { x: -5, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
      { x: 5, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
      { x: 15, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
      { x: 25, y: 55, tint: 0xff0000, speed: { min: 80, max: 150 }, scale: { start: 0.8, end: 0 }, angle: { min: 80, max: 100 } },
    ]
  },
  'ship-1': {
    assetKey: 'ship-1',
    assetPath: ship1Img,
    thrusters: [
      { x: 0, y: 60, tint: 0xff8800, speed: { min: 100, max: 200 }, scale: { start: 1.2, end: 0 }, angle: { min: 80, max: 100 } }
    ]
  },
  'simple-spaceship': {
    assetKey: 'simple-spaceship',
    assetPath: simpleSpaceshipImg,
    thrusters: [
      { x: -15, y: 45, tint: 0xffff00, speed: { min: 60, max: 120 }, scale: { start: 0.6, end: 0 }, angle: { min: 80, max: 100 } },
      { x: 15, y: 45, tint: 0xffff00, speed: { min: 60, max: 120 }, scale: { start: 0.6, end: 0 }, angle: { min: 80, max: 100 } }
    ]
  },
  'spaceship': {
    assetKey: 'spaceship',
    assetPath: spaceshipImg,
    thrusters: [
      { x: 0, y: 60, tint: 0xff00ff, speed: { min: 120, max: 220 }, scale: { start: 1.5, end: 0 }, angle: { min: 80, max: 100 } },
      { x: -35, y: 50, tint: 0xff88ff, speed: { min: 60, max: 120 }, scale: { start: 0.7, end: 0 }, angle: { min: 80, max: 100 } },
      { x: 35, y: 50, tint: 0xff88ff, speed: { min: 60, max: 120 }, scale: { start: 0.7, end: 0 }, angle: { min: 80, max: 100 } }
    ]
  }
};
