import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const tracks = [
  ['889f70df-b662-4115-a5cb-2c58faa77315', 'uf-edition.mp3'],
  ['8358d720-39cd-41d6-8d3f-6204ccb40163', 'kentucky-edition.mp3'],
  ['bc0ef21c-9db7-41da-a788-67abe51822c4', 'original.mp3'],
];
for (const [id, filename] of tracks) {
  const source = 'https://cdn1.suno.ai/' + id + '.mp3';
  const target = 'public/audio/bury-me-in-garnet/' + filename;
  const response = await fetch(source);
  if (!response.ok) throw new Error('Cannot fetch Bury Me in Garnet (' + filename + '): HTTP ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100000) throw new Error('Audio download too small: ' + filename);
  const mp3 = bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (!mp3) throw new Error('Invalid MP3 signature: ' + filename);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  console.log('Installed ' + filename + ' (' + bytes.length + ' bytes)');
}
