import fs from 'node:fs';
import sharp from 'sharp';

// Re-encode approved originals. Never generate or replace the subjects.
const photos = {
  'home-crowd': 'public/images/gallery/four-dogs-survey-showdown-bozes-women.jpg',
  'wedding-floor': 'public/images/wedding.jpg',
};
fs.mkdirSync('public/images/optimized', { recursive: true });
for (const [name, source] of Object.entries(photos)) {
  for (const width of (name === 'wedding-floor' ? [480, 800] : [480, 800, 960, 1440])) {
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/images/optimized/${name}-${width}.webp`);
  }
}
// The master remains the fallback. Lossless WebP avoids sending a 512 px badge in a 60 px header.
await sharp('public/images/logo.png').resize({width:144}).webp({lossless:true})
  .toFile('public/images/optimized/logo-144.webp');
console.log('Prepared responsive WebP versions of approved event photographs.');
