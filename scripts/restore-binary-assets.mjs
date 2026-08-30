import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const archiveNames = readdirSync(root).filter((name) => {
  const lower = name.toLowerCase();
  return lower.endsWith('.zip') || lower.endsWith('.zip.b64');
});

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
  ['assets/gallery/four-dogs-trivia-first-place-winner.webp', 'public/images/gallery/four-dogs-trivia-first-place-winner.webp'],
  ['assets/gallery/four-dogs-wedding-ceremony-crowd.webp', 'public/images/gallery/four-dogs-wedding-ceremony-crowd.webp'],
  ['assets/gallery/four-dogs-wedding-dance-floor-crowd-poster.webp', 'public/images/gallery/four-dogs-wedding-dance-floor-crowd-poster.webp'],
  ['assets/gallery/four-dogs-wedding-dance-floor-crowd.mp4', 'public/videos/gallery/four-dogs-wedding-dance-floor-crowd.mp4'],
];

if (archiveNames.length === 0) {
  throw new Error('No root-level reference ZIP archives were found.');
}

const archivePaths = new Map();
const decodedArchivePaths = [];

for (const archiveName of archiveNames) {
  const sourcePath = join(root, archiveName);
  if (archiveName.toLowerCase().endsWith('.zip.b64')) {
    const decodedPath = join(root, `.${archiveName}.decoded.zip`);
    const encoded = readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
    writeFileSync(decodedPath, Buffer.from(encoded, 'base64'));
    archivePaths.set(archiveName, decodedPath);
    decodedArchivePaths.push(decodedPath);
  } else {
    archivePaths.set(archiveName, sourcePath);
  }
}

const entriesByArchive = new Map();
for (const archiveName of archiveNames) {
  const archivePath = archivePaths.get(archiveName);
  const listing = execFileSync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .filter(Boolean);
  entriesByArchive.set(archiveName, listing);
}

function restoreEntry(archiveName, entry, destinationPath) {
  const destination = join(root, destinationPath);
  mkdirSync(dirname(destination), { recursive: true });
  const bytes = execFileSync('unzip', ['-p', archivePaths.get(archiveName), entry], {
    encoding: 'buffer',
    maxBuffer: 100 * 1024 * 1024,
  });
  writeFileSync(destination, bytes);
  console.log(`Restored ${destinationPath} from ${archiveName}: ${entry}`);
}

const missing = [];

for (const [sourcePath, destinationPath] of requiredAssets) {
  const destination = join(root, destinationPath);
  if (existsSync(destination)) {
    console.log(`Already present: ${destinationPath}`);
    continue;
  }

  let found = null;
  for (const [archiveName, entries] of entriesByArchive) {
    const entry = entries.find(
      (candidate) => candidate === sourcePath || candidate.endsWith(`/${sourcePath}`),
    );
    if (entry) {
      found = { archiveName, entry };
      break;
    }
  }

  if (!found) {
    missing.push(sourcePath);
    continue;
  }

  restoreEntry(found.archiveName, found.entry, destinationPath);
}

for (const decodedPath of decodedArchivePaths) {
  rmSync(decodedPath, { force: true });
}

if (missing.length > 0) {
  throw new Error(`Required assets were not found in the reference ZIPs:\n${missing.join('\n')}`);
}

console.log(`Restored/verified ${requiredAssets.length} required binary assets.`);
