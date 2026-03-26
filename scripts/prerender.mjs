/**
 * Post-build prerender script using Playwright (already in devDependencies).
 * Serves dist/ locally, visits each route, saves rendered HTML as static files.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const PORT = 4936;

// Collect all tool routes from source
const toolPaths = execSync('grep -r "path:" src/tools/*/index.ts', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .map(line => line.match(/path:\s*'([^']+)'/)?.[1])
  .filter(Boolean);

const routes = ['/', ...toolPaths];

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json',
};

function createStaticServer() {
  return createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    let filePath = join(DIST, urlPath);
    if (!extname(filePath) || !existsSync(filePath)) {
      filePath = join(DIST, 'index.html');
    }
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

async function prerender() {
  console.log(`🚀 Prerendering ${routes.length} routes...`);

  const server = createStaticServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`📡 Static server on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: true });

  let success = 0;
  let failed = 0;

  for (const route of routes) {
    try {
      const page = await context.newPage();
      // Block heavy resources for speed
      await page.route(/\.(png|jpg|jpeg|gif|webp|woff2?|ttf|mp4|webm)$/, r => r.abort());

      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForSelector('#app', { timeout: 5000 });
      await page.waitForTimeout(500);

      const html = await page.content();

      const outDir = route === '/' ? DIST : resolve(DIST, route.replace(/^\//, ''));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'index.html'), html, 'utf8');

      success++;
      if (success % 10 === 0 || success === routes.length) {
        console.log(`  ✅ ${success}/${routes.length} done`);
      }
      await page.close();
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed: ${route} — ${err.message}`);
    }
  }

  await context.close();
  await browser.close();
  server.close();

  console.log(`\n🏁 Prerender complete: ${success} success, ${failed} failed out of ${routes.length} routes`);
  if (failed > 0) process.exit(1);
}

prerender().catch(err => {
  console.error('Fatal prerender error:', err);
  process.exit(1);
});
