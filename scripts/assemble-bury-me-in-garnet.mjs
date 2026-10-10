import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

// Audio is stored as small, unmodified binary pieces to satisfy upload limits.
// Restore the exact user-provided MP3 bytes and verify SHA-256 before publishing.
const recordings = [
  {
    "name": "uf-edition.mp3",
    "folder": "uf-edition",
    "size": 6228570,
    "sha256": "ba058ae019ffca4c1721f3927497e881ccdc5aa157e0732190dcccc3ca4851bd",
    "parts": 8
  },
  {
    "name": "kentucky-edition.mp3",
    "folder": "kentucky-edition",
    "size": 5971143,
    "sha256": "4f5b13e8b2630a9dd2e56e7b5eb2cf7a7c5969745e9424c4577bc6c8eda4d6d5",
    "parts": 8
  },
  {
    "name": "original.mp3",
    "folder": "original",
    "size": 5457960,
    "sha256": "53e882e4e3842c50540332eec99b66725368245a15b8398745df40c183df1001",
    "parts": 7
  }
];
for (const track of recordings) {
  const sourceDir=join('assets','music',track.folder);
  const names=(await readdir(sourceDir)).filter(name=>/^\d{2}\.part$/.test(name)).sort();
  if (names.length !== track.parts) throw new Error('Missing audio piece for '+track.name+': '+names.length+'/'+track.parts);
  const parts=await Promise.all(names.map(name=>readFile(join(sourceDir,name))));
  const combined=Buffer.concat(parts);
  const digest=createHash('sha256').update(combined).digest('hex');
  if(combined.length!==track.size || digest!==track.sha256) throw new Error('Audio integrity failed for '+track.name+'; expected '+track.sha256+', got '+digest);
  const destination=join('public','audio','bury-me-in-garnet',track.name);
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,combined);
  console.log('Verified full recording '+track.name+' ('+combined.length+' bytes; SHA-256 '+digest.slice(0,12)+'...)');
}
