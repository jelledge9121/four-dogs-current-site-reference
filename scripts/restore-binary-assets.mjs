import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const archives = readdirSync(root).filter((name) => name.toLowerCase().endsWith('.zip'));

const requiredAssets = [
  ['assets/four-dogs-favicon-32.png', 'public/favicon.png'],
  ['assets/four-dogs-logo.png', 'public/images/logo.png'],
  ['assets/four-dogs-social-card.jpg', 'public/images/social-card.jpg'],
  ['assets/four-dogs-entertainment-trivia-night-crowd-in-a26875db66.jpg', 'public/images/hero.jpg'],
  ['assets/full-dance-floor-at-four-dogs-entertainment-p-7a8def119e.jpg', 'public/images/wedding.jpg'],
  ['assets/jim-kennedy-four-dogs-entertainment-host-for--117040b526.jpg', 'public/images/host.jpg'],
  ['assets/work-excuses/four-dogs-trivia-work-excuse-signed.pdf', 'public/downloads/four-dogs-trivia-work-excuse-signed.pdf'],
  ['assets/work-excuses/four-dogs-music-bingo-work-excuse-signed.pdf', 'public/downloads/four-dogs-music-bingo-work-excuse-signed.pdf'],
  ['assets/christmas/santa-jim-christmas-in-july-four-dogs-01.jpg', 'public/images/christmas/santa-jim-christmas-in-july-four-dogs-01.jpg'],
  ['assets/christmas/santa-jim-christmas-in-july-four-dogs-02.jpg', 'public/images/christmas/santa-jim-christmas-in-july-four-dogs-02.jpg'],
  ['assets/christmas/santa-jim-christmas-party-four-dogs-05.jpg', 'public/images/christmas/santa-jim-christmas-party-four-dogs-05.jpg'],
  ['assets/christmas/santa-jim-holiday-party-four-dogs-03.jpg', 'public/images/christmas/santa-jim-holiday-party-four-dogs-03.jpg'],
  ['assets/gallery/four-dogs-entertainment-event-photo-19.webp', 'public/images/gallery/four-dogs-entertainment-event-photo-19.webp'],
  ['assets/gallery/four-dogs-entertainment-event-photo-29.webp', 'public/images/gallery/four-dogs-entertainment-event-photo-29.webp'],
  ['assets/gallery/four-dogs-entertainment-event-photo-34.webp', 'public/images/gallery/four-dogs-entertainment-event-photo-34.webp'],
  ['assets/gallery/four-dogs-entertainment-event-photo-37.webp', 'public/images/gallery/four-dogs-entertainment-event-photo-37.webp'],
  ['assets/gallery/four-dogs-private-event-dance-floor-01-poster.webp', 'public/images/gallery/four-dogs-private-event-dance-floor-01-poster.webp'],
  ['assets/gallery/four-dogs-private-event-dance-floor-02-poster.webp', 'public/images/gallery/four-dogs-private-event-dance-floor-02-poster.webp'],
];

if (archives.length === 0) {
  throw new Error('No root-level reference ZIP archives were found.');
}

const entriesByArchive = new Map();
for (const archive of archives) {
  const listing = execFileSync('unzip', ['-Z1', join(root, archive)], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .filter(Boolean);
  entriesByArchive.set(archive, listing);
}

function restoreEntry(archive, entry, destinationPath) {
  const destination = join(root, destinationPath);
  mkdirSync(dirname(destination), { recursive: true });
  const bytes = execFileSync('unzip', ['-p', join(root, archive), entry], {
    encoding: 'buffer',
    maxBuffer: 100 * 1024 * 1024,
  });
  writeFileSync(destination, bytes);
  console.log(`Restored ${destinationPath} from ${archive}: ${entry}`);
}

const missing = [];

for (const [sourcePath, destinationPath] of requiredAssets) {
  const destination = join(root, destinationPath);
  if (existsSync(destination)) {
    console.log(`Already present: ${destinationPath}`);
    continue;
  }

  let found = null;
  for (const [archive, entries] of entriesByArchive) {
    const entry = entries.find(
      (candidate) => candidate === sourcePath || candidate.endsWith(`/${sourcePath}`),
    );
    if (entry) {
      found = { archive, entry };
      break;
    }
  }

  if (!found) {
    missing.push(sourcePath);
    continue;
  }

  restoreEntry(found.archive, found.entry, destinationPath);
}

if (missing.length > 0) {
  throw new Error(`Required assets were not found in the reference ZIPs:\n${missing.join('\n')}`);
}

console.log(`Restored/verified ${requiredAssets.length} required binary assets.`);
