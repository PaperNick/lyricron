import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist-site');
const distDir = path.join(root, 'dist');

// Single source of truth for the public site URL. Override via SITE_URL env var.
const siteUrl = (process.env.SITE_URL ?? 'https://PaperNick.github.io/lyricron').replace(/\/$/, '');
const repoUrl = 'https://github.com/PaperNick/lyricron';

/** Short commit hash of the revision being deployed ('' when unavailable). */
function getRevision() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** All files under `dir`, recursively. */
function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

/** Turns a built .html path into its public URL (`index.html` → `/`). */
function toUrl(relativePath) {
  const withoutIndex = relativePath.replace(/\/?index\.html$/, '');
  return `${siteUrl}/${withoutIndex === '' ? '' : `${withoutIndex}/`}`;
}

const revision = getRevision();
const revisionSnippet = revision
  ? `<a class="foot-rev" href="${repoUrl}/commit/${revision}" target="_blank" rel="noreferrer">rev ${revision}</a>`
  : '';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(path.join(root, 'website'), outDir, { recursive: true });

// Resolve the __SITE_URL__ placeholder in every text file outside the app bundle.
const textExtensions = new Set(['.html', '.txt', '.xml']);
const appDir = path.join(outDir, 'app');
for (const filePath of walk(outDir)) {
  if (filePath.startsWith(appDir + path.sep) || !textExtensions.has(path.extname(filePath))) {
    continue;
  }
  const content = readFileSync(filePath, 'utf8').replaceAll('__SITE_URL__', siteUrl);
  writeFileSync(filePath, content);
}

// Generate sitemap.xml: one entry per built .html page.
const pageUrls = walk(outDir)
  .filter((filePath) => path.extname(filePath) === '.html')
  .map((filePath) => toUrl(path.relative(outDir, filePath)))
  .sort();
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pageUrls.map((url) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);

// Stamp the deployed revision into the landing page footer.
const indexPath = path.join(outDir, 'index.html');
if (existsSync(indexPath)) {
  const content = readFileSync(indexPath, 'utf8').replace(
    '<span hidden>__REVISION__</span>',
    revisionSnippet,
  );
  writeFileSync(indexPath, content);
}

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}
cpSync(distDir, path.join(outDir, 'app'), { recursive: true });

console.log(
  `Assembled site at ${path.relative(root, outDir)}/ (site URL: ${siteUrl}${revision ? `, rev ${revision}` : ''}, ${pageUrls.length} pages in sitemap)`,
);
