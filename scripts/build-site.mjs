import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

const revision = getRevision();
const revisionSnippet = revision
  ? `<a class="foot-rev" href="${repoUrl}/commit/${revision}" target="_blank" rel="noreferrer">rev ${revision}</a>`
  : '';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(path.join(root, 'website'), outDir, { recursive: true });

// Resolve the __SITE_URL__ placeholder in the copied text files.
for (const name of ['index.html', 'llms.txt']) {
  const filePath = path.join(outDir, name);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8').replaceAll('__SITE_URL__', siteUrl);
    writeFileSync(filePath, content);
  }
}

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
  `Assembled site at ${path.relative(root, outDir)}/ (site URL: ${siteUrl}${revision ? `, rev ${revision}` : ''})`,
);
