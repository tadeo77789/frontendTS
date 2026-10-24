// Sirve dist/ y reenvía /api al gateway, como hace Caddy en producción:
// la web compilada usa la ruta relativa /api (api.config.ts).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.env.E2E_WEB_PORT ?? 4173);
const API = new URL(process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080');
const ROOT = resolve('dist');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.task': 'application/octet-stream', '.bin': 'application/octet-stream',
};

createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const proxied = request(
      { host: API.hostname, port: API.port, path: req.url, method: req.method, headers: req.headers },
      upstream => { res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res); },
    );
    proxied.on('error', () => { res.writeHead(502).end(); });
    req.pipe(proxied);
    return;
  }
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(ROOT, path));
  // Fuera de dist/ o inexistente: index.html (la SPA resuelve la ruta).
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`e2e web en http://localhost:${PORT}`));
