import fs from 'node:fs';
import path from 'node:path';

const root = 'dist';
if (!fs.existsSync(root)) throw new Error('dist is missing; run the production build first.');

const files = [];
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : files.push(path.join(directory, entry.name))
);
walk(root);

const htmlFiles = files.filter((file) => file.endsWith('.html'));
const routes = new Set(htmlFiles.map((file) => `/${path.relative(root, file).replace(/index\.html$/, '').replace(/\\/g, '/')}`));
const publicFiles = new Set(files.map((file) => `/${path.relative(root, file).replace(/\\/g, '/')}`));
const errors = [];
const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  else if (titles.has(title)) errors.push(`${file}: duplicate title also used by ${titles.get(title)}`);
  else titles.set(title, file);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${file}: missing description`);
  if (!/rel="canonical" href="https:\/\/4dogsentertainment\.com\//.test(html)) errors.push(`${file}: missing production canonical`);
  if (!/<meta property="og:title"/.test(html) || !/<meta property="og:description"/.test(html)) errors.push(`${file}: incomplete Open Graph metadata`);
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (description && descriptions.has(description)) errors.push(`${file}: duplicate description also used by ${descriptions.get(description)}`);
  else if (description) descriptions.set(description, file);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) errors.push(`${file}: expected exactly one h1`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]*"/.test(image[0])) errors.push(`${file}: image missing alt attribute`);
  }
  for (const schema of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(schema[1]); } catch { errors.push(`${file}: invalid JSON-LD`); }
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (url.startsWith('//')) continue;
    const route = url.endsWith('/') ? url : `${url}/`;
    if (!routes.has(route) && !routes.has(url) && !publicFiles.has(url)) errors.push(`${file}: broken internal reference ${url}`);
  }
}

const booking = fs.readFileSync(path.join(root, 'booking', 'index.html'), 'utf8');
for (const marker of ['name="booking"', 'data-netlify="true"', 'netlify-honeypot="bot-field"', 'name="form-name"', 'action="/thank-you/"', 'name="referral-source"', 'data-service-slug="music-bingo"', 'data-service-slug="almost-married-trivia-experience"']) {
  if (!booking.includes(marker)) errors.push(`booking/index.html: missing ${marker}`);
}
for (const asset of ['_redirects', '_headers', 'robots.txt', 'llms.txt', 'sitemap-index.xml']) {
  if (!publicFiles.has(`/${asset}`)) errors.push(`dist: missing ${asset}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} pages; unique metadata, internal links/assets, discovery files, and Netlify booking markup verified.`);
