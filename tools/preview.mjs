import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import generateTrivia from '../api/trivia.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = new Set(['index.html', 'blog.html', 'blog-post.html', 'script.js', 'styles.css']);
const mimeTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
}));

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/trivia') {
      response.setHeader('Cache-Control', 'no-store');
      await generateTrivia({
        method: request.method,
        query: Object.fromEntries(url.searchParams),
      }, {
        status(code) {
          response.statusCode = code;
          return this;
        },
        json(data) {
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify(data));
        },
      });
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405).end();
      return;
    }
    const relative = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
    const type = mimeTypes.get(extname(relative).toLowerCase());
    const file = resolve(root, relative);
    const isAsset = relative.startsWith('assets/') && file.startsWith(resolve(root, 'assets') + sep);
    if (!type || (!publicFiles.has(relative) && !isAsset)) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': 'no-store' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end();
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Local preview: http://127.0.0.1:4173/#process');
  if (!process.env.GEMINI_API_KEY) console.log('Add GEMINI_API_KEY to .env for generated trivia.');
});
