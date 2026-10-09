import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Builds an ID3v2.3 USLT (unsynchronized lyrics) frame with UTF-8 text. */
function usltFrame(text: string): number[] {
  return frame('USLT', [3, ...ascii('eng'), 0, ...new TextEncoder().encode(text)]);
}

/** Builds an ID3v2.3 SYLT (synchronized lyrics) frame with millisecond entries. */
function syltFrame(entries: Array<{ text: string; timeMs: number }>): number[] {
  const parts: number[][] = [[3], ascii('eng'), [2, 1], [0]];
  for (const entry of entries) {
    parts.push(
      [...new TextEncoder().encode(entry.text)],
      [0],
      [
        (entry.timeMs >>> 24) & 0xff,
        (entry.timeMs >>> 16) & 0xff,
        (entry.timeMs >>> 8) & 0xff,
        entry.timeMs & 0xff,
      ],
    );
  }
  return frame('SYLT', parts.flat());
}

function frame(id: string, payload: number[]): number[] {
  const size = payload.length;
  return [
    ...ascii(id),
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    0,
    0,
    ...payload,
  ];
}

function synchsafe(size: number): number[] {
  return [(size >>> 21) & 0x7f, (size >>> 14) & 0x7f, (size >>> 7) & 0x7f, size & 0x7f];
}

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

/** A few silent MPEG-1 Layer III frames so the file is playable-ish. */
function silentMp3Frames(count: number): Buffer {
  const frameBytes = Buffer.alloc(417);
  frameBytes[0] = 0xff;
  frameBytes[1] = 0xfb;
  frameBytes[2] = 0x90;
  frameBytes[3] = 0x00;
  return Buffer.concat(Array.from({ length: count }, () => frameBytes));
}

/** Wraps ID3 frames in a v2.3 tag followed by silent MPEG audio. */
function taggedMp3(
  name: string,
  frames: number[][],
): { name: string; mimeType: string; buffer: Buffer } {
  const body = frames.flat();
  const tag = [0x49, 0x44, 0x33, 3, 0, 0, ...synchsafe(body.length), ...body];
  return {
    name,
    mimeType: 'audio/mpeg',
    buffer: Buffer.concat([Buffer.from(tag), silentMp3Frames(4)]),
  };
}

function tagsCard(page: Page) {
  return page.getByRole('button', { name: /Load from MP3/ });
}

/** The timed lyrics list in the editor; scoping avoids plain-textarea duplicates. */
function rawList(page: Page) {
  return page.getByTestId('raw-list');
}

async function dropFile(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.goto('/');
  await page.setInputFiles('input[type="file"][accept*="audio"]', file);
  await expect(page.getByText('Add lyrics')).toBeVisible();
}

test('offers loading SYLT lyrics from the MP3 tags', async ({ page }) => {
  await dropFile(
    page,
    taggedMp3('tagged.mp3', [
      syltFrame([
        { text: 'First line', timeMs: 5000 },
        { text: 'Second line', timeMs: 10500 },
      ]),
    ]),
  );

  await tagsCard(page).click();

  await expect(page.getByRole('heading', { name: 'Timed lyrics' })).toBeVisible();
  await expect(rawList(page).getByText('First line')).toBeVisible();
  await expect(rawList(page).getByText('Second line')).toBeVisible();
  await expect(page.getByRole('button', { name: '00:05.00' })).toBeVisible();
  await expect(page.getByRole('button', { name: '00:10.50' })).toBeVisible();
});

test('offers loading timed USLT lyrics when there is no SYLT frame', async ({ page }) => {
  await dropFile(
    page,
    taggedMp3('uslt-timed.mp3', [usltFrame('[00:01.00]Hello USLT\n[00:02.50]Second')]),
  );

  await tagsCard(page).click();

  await expect(rawList(page).getByText('Hello USLT')).toBeVisible();
  await expect(page.getByRole('button', { name: '00:01.00' })).toBeVisible();
  await expect(page.getByRole('button', { name: '00:02.50' })).toBeVisible();
});

test('offers loading plain USLT lyrics as plain text', async ({ page }) => {
  await dropFile(page, taggedMp3('uslt-plain.mp3', [usltFrame('Plain one\nPlain two')]));

  await tagsCard(page).click();

  await expect(rawList(page).getByText('Plain one')).toBeVisible();
  await expect(rawList(page).getByText('Plain two')).toBeVisible();
  await expect(rawList(page).getByText('--:--.--').first()).toBeVisible();
});

test('hides the tags card when the MP3 has no embedded lyrics', async ({ page }) => {
  await dropFile(
    page,
    taggedMp3('clean.mp3', [frame('TIT2', [3, ...new TextEncoder().encode('Just a title')])]),
  );

  await expect(tagsCard(page)).toHaveCount(0);

  await page.getByText('Enter Manually').click();
  await expect(page.getByRole('heading', { name: 'Timed lyrics' })).toBeVisible();
});

test('hides the tags card for files that are not MP3s', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"][accept*="audio"]', {
    name: 'song.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.alloc(64),
  });

  await expect(page.getByText('Add lyrics')).toBeVisible();
  await expect(page.getByRole('button', { name: /Load from MP3/ })).toHaveCount(0);
  await expect(page.getByText('Enter Manually')).toBeVisible();
});

test('reloads embedded lyrics from the tags after clearing the editor', async ({ page }) => {
  await dropFile(
    page,
    taggedMp3('tagged.mp3', [syltFrame([{ text: 'First line', timeMs: 5000 }])]),
  );

  await tagsCard(page).click();
  await expect(rawList(page).getByText('First line')).toBeVisible();

  await page.getByRole('button', { name: 'Clear' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Clear' }).click();

  await expect(page.getByText('Add lyrics')).toBeVisible();
  await tagsCard(page).click();
  await expect(rawList(page).getByText('First line')).toBeVisible();
});
