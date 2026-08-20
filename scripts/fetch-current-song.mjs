import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const sourceUrl = 'https://cdn1.suno.ai/0bf1367d-28d6-4e1b-ac2e-23295d074829.mp3';
const destination = 'public/audio/four-dogs-song.mp3';

const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Could not fetch the current Four Dogs song: ${response.status} ${response.statusText}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 1000) {
  throw new Error(`Downloaded Four Dogs song was unexpectedly small: ${bytes.length} bytes`);
}

const hasId3Header = bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
const hasMp3FrameSync = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
if (!hasId3Header && !hasMp3FrameSync) {
  throw new Error('Downloaded Four Dogs song did not look like a valid MP3 file.');
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, bytes);
console.log(`Installed current Four Dogs song at ${destination} (${bytes.length} bytes).`);
