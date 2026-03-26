/**
 * 构建后生成 sitemap.xml
 * 用法: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 从工具目录提取所有路径
const paths = execSync('grep -r "path:" src/tools/*/index.ts', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .map(line => line.match(/path:\s*'([^']+)'/)?.[1])
  .filter(Boolean);

const SITE_URL = process.env.SITE_URL || 'https://it-tools.tech';
const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  ...paths.map(p => ({ loc: p, priority: '0.8', changefreq: 'monthly' })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const outPath = resolve(ROOT, 'dist/sitemap.xml');
writeFileSync(outPath, sitemap, 'utf8');
console.log(`✅ sitemap.xml generated with ${urls.length} URLs → dist/sitemap.xml`);
