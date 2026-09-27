import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'file://' + path.join(root, 'website', 'index.html');
const out = path.join(root, 'website', 'card.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(url, { waitUntil: 'networkidle' });

// Hide the nav and stretch the hero to fill a 1200x630 card, centered.
await page.addStyleTag({
  content: `
    .nav { display: none !important; }
    .hero {
      height: 630px !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      display: flex !important;
      align-items: center !important;
    }
    .hero .wrap { width: 100%; }
  `,
});

const hero = page.locator('.hero');
const box = await hero.boundingBox();
console.log('hero box:', JSON.stringify(box));

await hero.screenshot({ path: out });
console.log('saved', out);

await browser.close();
