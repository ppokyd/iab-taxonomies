import { createServer } from 'node:http';
import { readFile, stat, symlink, readlink } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = resolve(import.meta.dirname, '..', 'public');
const DATA_SRC = resolve(import.meta.dirname, '..', 'data');
const DATA_DEST = join(PUBLIC_DIR, 'data');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function ensureDataSymlink() {
  try {
    const target = await readlink(DATA_DEST);
    if (resolve(join(PUBLIC_DIR, target)) === DATA_SRC) return;
  } catch {
    // doesn't exist or not a symlink
  }

  try {
    await symlink(DATA_SRC, DATA_DEST);
    console.log(`  Symlinked public/data → data/`);
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      console.log(`  public/data/ already exists (not a symlink) — using it as-is`);
    } else {
      throw err;
    }
  }
}

async function serveFile(filePath: string): Promise<{ status: number; body: Buffer | string; mime: string }> {
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    const body = await readFile(filePath);
    const mime = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    return { status: 200, body, mime };
  } catch {
    return { status: 404, body: 'Not Found', mime: 'text/plain' };
  }
}

await ensureDataSymlink();

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const filePath = join(PUBLIC_DIR, decodeURIComponent(url.pathname));

  // prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  const { status, body, mime } = await serveFile(filePath);
  res.writeHead(status, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`  Port ${PORT} is in use — try PORT=${PORT + 1} npm run dev`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n  IAB Taxonomies Explorer`);
  console.log(`  http://localhost:${PORT}\n`);
});
