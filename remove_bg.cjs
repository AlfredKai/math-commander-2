const Jimp = require('jimp');

async function removeBlackBg() {
  try {
    const image = await Jimp.read('src/assets/spaceship_no_engines.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If the pixel is very dark (almost black)
      if (r < 25 && g < 25 && b < 25) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
      }
    });
    await image.writeAsync('src/assets/spaceship_no_engines.png');
    console.log("Done removing black background.");
  } catch (err) {
    console.error("Error processing image:", err);
  }
}

removeBlackBg();
