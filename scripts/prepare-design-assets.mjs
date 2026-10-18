import fs from 'node:fs';
import sharp from 'sharp';

// Re-encode approved originals. Never generate or replace the subjects.
const photos = {
  'home-crowd': 'public/images/gallery/four-dogs-survey-showdown-bozes-women.jpg',
  'wedding-floor': 'public/images/wedding.jpg',
};
fs.mkdirSync('public/images/optimized', { recursive: true });
for (const [name, source] of Object.entries(photos)) {
  for (const width of (name === 'wedding-floor' ? [480, 800] : [480, 960, 1440])) {
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/images/optimized/${name}-${width}.webp`);
  }
}
console.log('Prepared responsive WebP versions of approved event photographs.');
