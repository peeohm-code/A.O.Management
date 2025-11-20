import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [384, 192, 152, 144, 128, 96, 72];
const inputPath = join(__dirname, 'client/public/icons/icon-512x512.png');

async function resizeIcons() {
  console.log('Resizing icons...');
  
  for (const size of sizes) {
    const outputPath = join(__dirname, `client/public/icons/icon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size)
      .toFile(outputPath);
    console.log(`✓ Created icon-${size}x${size}.png`);
  }
  
  console.log('All icons created successfully!');
}

resizeIcons().catch(console.error);
