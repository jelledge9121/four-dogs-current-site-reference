// Run the generated Netlify server and its static assets on loopback for browser QA.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import createHandler from '../.netlify/build/entry.mjs';

const root = resolve('dist');
const handle = createHandler({notFoundContent: await readFile(resolve(root, '404.html'), 'utf8')});
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg', '.pdf': 'application/pdf'
};
const port = Number(process.env.QA_PORT || 4321);
createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {Allow: 'GET, HEAD'}).end();
      return;
    }
    const url = new URL(req.url, 'http://127.0.0.1');
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(400).end();
      return;
    }
    let asset = await stat(file).catch(() => null);
    if (asset?.isDirectory()) {
      file = resolve(file, 'index.html');
      asset = await stat(file).catch(() => null);
    }
    if (asset?.isFile()) {
      res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': asset.size});
      if (req.method === 'HEAD') res.end();
      else createReadStream(file).on('error', () => res.destroy()).pipe(res);
      return;
    }
    const canonical = new URL(url.pathname + url.search, 'https://4dogsentertainment.com');
    const response = await handle(new Request(canonical, {method: req.method}), {ip: '127.0.0.1'});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Local QA response failed', error.name);
    res.writeHead(500).end();
  }
}).listen(port, '127.0.0.1');
