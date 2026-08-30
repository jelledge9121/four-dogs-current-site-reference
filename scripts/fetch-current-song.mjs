import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const sourceUrls = [
  'https://cdn1.suno.ai/0bf1367d-28d6-4e1b-ac2e-23295d074829.mp3',
  'https://4dogsentertainment.com/audio/four-dogs-song.mp3',
];
const destination = 'public/audio/four-dogs-song.mp3';

let bytes = null;
let installedFrom = null;
let lastError = null;

for (const sourceUrl of sourceUrls) {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      lastError = new Error(`Could not fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
      continue;
    }

    const candidate = Buffer.from(await response.arrayBuffer());
    if (candidate.length < 1000) {
      lastError = new Error(`Downloaded Four Dogs song from ${sourceUrl} was unexpectedly small: ${candidate.length} bytes`);
      continue;
    }

    const hasId3Header = candidate.length >= 3 && candidate[0] === 0x49 && candidate[1] === 0x44 && candidate[2] === 0x33;
    const hasMp3FrameSync = candidate.length >= 2 && candidate[0] === 0xff && (candidate[1] & 0xe0) === 0xe0;
    if (!hasId3Header && !hasMp3FrameSync) {
      lastError = new Error(`Downloaded Four Dogs song from ${sourceUrl} did not look like a valid MP3 file.`);
      continue;
    }

    bytes = candidate;
    installedFrom = sourceUrl;
    break;
  } catch (error) {
    lastError = error;
  }
}

if (!bytes) {
  throw lastError ?? new Error('Could not fetch the current Four Dogs song from any configured source.');
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, bytes);
console.log(`Installed current Four Dogs song at ${destination} from ${installedFrom} (${bytes.length} bytes).`);
