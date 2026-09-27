import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const SAMPLE_RATE = 8000;

/** Builds a silent PCM WAV in memory so the suite has no binary fixture. */
function silentWav(seconds: number): Buffer {
  const samples = seconds * SAMPLE_RATE;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

const AUDIO = { name: 'sample.wav', mimeType: 'audio/wav', buffer: silentWav(30) };

async function loadAudio(page: Page) {
  await page.goto('/');
  await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
  await page.getByText('Enter Manually').click();
  await expect(page.getByRole('tab', { name: 'Lyrics' })).toBeVisible();
}

test.describe('mobile layout', () => {
  test('uses tabbed panes and switches between them', async ({ page }) => {
    await loadAudio(page);

    await expect(page.getByRole('tab', { name: 'Lyrics' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'Timed' }).click();
    await expect(page.getByTestId('raw-list')).toBeVisible();
  });

  test('auto-switches to Timed on annotate and exposes a per-line menu', async ({ page }) => {
    await loadAudio(page);
    await page.locator('textarea:not([readonly])').first().fill('Line one\nLine two\nLine three');

    await page.getByRole('button', { name: 'Play' }).click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Annotate' }).click();

    // Annotating switches to the Timed tab.
    await expect(page.getByTestId('raw-list')).toBeVisible();
    const stamp = page.locator('button[title="Click to edit the timestamp"]').first();
    await expect(stamp).not.toHaveText('--:--.--');

    // Per-line actions live behind a ⋮ menu on mobile.
    await page.getByRole('button', { name: 'Line actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete timestamp' }).click();
    await expect(stamp).toHaveText('--:--.--');
  });
});
