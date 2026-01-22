import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, basename, extname } from 'path';

const INPUT_DIR = './public/demo_pack/use_case_images';

async function convertPngsToWebp() {
  const files = await readdir(INPUT_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  console.log(`Found ${pngFiles.length} PNG files to convert...`);

  for (const file of pngFiles) {
    const inputPath = join(INPUT_DIR, file);
    const outputName = basename(file, extname(file)) + '.webp';
    const outputPath = join(INPUT_DIR, outputName);

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`✓ Converted: ${file} → ${outputName}`);
  }

  console.log('\nDone! You can now delete the original PNG files if desired.');
}

convertPngsToWebp().catch(console.error);
