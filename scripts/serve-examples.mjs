import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const examplesDir = path.join(root, 'examples');
const distDir = path.join(root, 'packages/core/dist');
const port = process.env.PORT || 5173;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.map': 'application/json', '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath;
  if (url.pathname.startsWith('/dist/')) filePath = path.join(distDir, url.pathname.replace('/dist/', ''));
  else filePath = path.join(examplesDir, url.pathname === '/' ? '/index.html' : url.pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => console.log(`Examples: http://localhost:${port}`));