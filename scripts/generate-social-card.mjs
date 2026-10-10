import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Produce a JPEG for iMessage, Facebook, and other Open Graph previews.
// The original Four Dogs logo is restored from the archived site before this runs.
const output = resolve('public/images/social-card-statewide.jpg');
const logo = resolve('public/images/logo.png');
const artwork = [
'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
'<defs>',
'<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0C0F26"/><stop offset="100%" stop-color="#052846"/></linearGradient>',
'<linearGradient id="panel" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#112E47"/><stop offset="100%" stop-color="#0A152E"/></linearGradient>',
'</defs>',
'<rect width="1200" height="630" fill="url(#bg)"/>',
'<circle cx="1158" cy="38" r="265" fill="none" stroke="#29C4DC" stroke-opacity=".10" stroke-width="2"/>',
'<circle cx="1158" cy="38" r="315" fill="none" stroke="#29C4DC" stroke-opacity=".07" stroke-width="2"/>',
'<circle cx="1158" cy="38" r="370" fill="none" stroke="#29C4DC" stroke-opacity=".04" stroke-width="2"/>',
'<rect x="48" y="45" width="442" height="540" rx="35" fill="url(#panel)" stroke="#29C4DC" stroke-opacity=".40" stroke-width="2"/>',
'<rect x="515" y="65" width="7" height="499" rx="3.5" fill="#29C4DC"/>',
'<text x="555" y="122" font-family="DejaVu Sans, Arial, sans-serif" font-size="43" font-weight="bold" fill="#F2F0E8" letter-spacing="1">FOUR DOGS</text>',
'<text x="557" y="153" font-family="DejaVu Sans, Arial, sans-serif" font-size="21" font-weight="bold" fill="#29C4DC" letter-spacing="2.7">ENTERTAINMENT</text>',
'<rect x="554" y="185" width="581" height="53" rx="13" fill="#F5AF37"/>',
'<text x="576" y="219" font-family="DejaVu Sans, Arial, sans-serif" font-size="23" font-weight="bold" fill="#0C0F26" letter-spacing=".4">TRIVIA  •  MUSIC BINGO  •  DJ</text>',
'<text x="555" y="302" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="bold" fill="#29C4DC" letter-spacing="2.3">SERVING SOUTH CAROLINA</text>',
'<text x="552" y="367" font-family="DejaVu Sans, Arial, sans-serif" font-size="36" font-weight="bold" fill="#F2F0E8">Columbia  •  Lexington</text>',
'<text x="552" y="422" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="bold" fill="#F2F0E8">Greenville  •  Charleston</text>',
'<path d="M555 450 H1113" stroke="#29C4DC" stroke-opacity=".40" stroke-width="2"/>',
'<text x="556" y="492" font-family="DejaVu Sans, Arial, sans-serif" font-size="21" fill="#F2F0E8">Bring your people. We’ll bring the</text>',
'<text x="556" y="523" font-family="DejaVu Sans, Arial, sans-serif" font-size="25" font-weight="bold" fill="#F5AF37">Doggone Good Time.</text>',
'<text x="555" y="575" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" fill="#29C4DC">4dogsentertainment.com</text>',
'</svg>',
].join('');

mkdirSync(dirname(output), { recursive: true });
const logoBuffer = await sharp(logo)
  .resize(398, 430, { fit: 'contain', withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(Buffer.from(artwork))
  .composite([{ input: logoBuffer, top: 96, left: 69 }])
  .jpeg({ quality: 91, progressive: true })
  .toFile(output);

console.log('Generated 1200x630 statewide social sharing image.');
