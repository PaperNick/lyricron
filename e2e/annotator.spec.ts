import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { LrclibResult } from '../src/lib/lrclib';

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
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

const AUDIO = { name: 'sample.wav', mimeType: 'audio/wav', buffer: silentWav(30) };

const SYNCED_RESULTS: LrclibResult[] = [
  {
    id: 1,
    trackName: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    duration: 200,
    instrumental: false,
    plainLyrics: 'Plain one\nPlain two',
    syncedLyrics: '[00:05.00]Synced one\n[00:10.00]Synced two',
  },
];

const PLAIN_RESULTS: LrclibResult[] = [
  {
    id: 1,
    trackName: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Album',
    duration: 200,
    instrumental: false,
    plainLyrics: 'Plain one\nPlain two',
    syncedLyrics: null,
  },
];

async function loadAudio(page: Page) {
  await page.goto('/');
  await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
  await page.getByText('Enter Manually').click();
  await expect(page.getByText('Timed lyrics')).toBeVisible();
}

async function pasteLyrics(page: Page, lines: string[]) {
  await page.locator('textarea:not([readonly])').first().fill(lines.join('\n'));
}

async function pasteIntoPlainField(page: Page, text: string) {
  await page.evaluate((content) => {
    const textarea = document.querySelector('textarea:not([readonly])');
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', content);
    dataTransfer.setData('text', content);
    textarea?.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, text);
}

async function currentTime(page: Page) {
  return page.evaluate(() => {
    const handle = (window as unknown as { __lyricron?: { getTime: () => number } }).__lyricron;
    return handle?.getTime() ?? -1;
  });
}

async function play(page: Page) {
  await page.locator('button', { hasText: 'Play' }).first().click();
  await page.waitForTimeout(1200);
}

const stampButtons = (page: Page) => page.locator('button[title="Click to edit the timestamp"]');

async function timedStampCount(page: Page) {
  return stampButtons(page).evaluateAll(
    (elements) =>
      elements.filter((element) => (element.textContent ?? '').trim() !== '--:--.--').length,
  );
}

async function seekTo(page: Page, time: number) {
  await page.evaluate((value) => {
    const handle = (window as unknown as { __lyricron?: { seek: (time: number) => void } })
      .__lyricron;
    handle?.seek(value);
  }, time);
}

/** Types a timestamp into a row's inline editor and commits it. */
async function setStamp(page: Page, index: number, value: string) {
  await stampButtons(page).nth(index).click();
  const field = page.locator('input:not([type])').first();
  await field.fill(value);
  await field.press('Enter');
}

async function pausePlayback(page: Page) {
  await page.evaluate(() => {
    const handle = (window as unknown as { __lyricron?: { pause: () => void } }).__lyricron;
    handle?.pause();
  });
}

async function isPaused(page: Page) {
  return page.evaluate(() => {
    const handle = (window as unknown as { __lyricron?: { isPlaying: () => boolean } }).__lyricron;
    return handle ? !handle.isPlaying() : false;
  });
}

test.describe('lyricron', () => {
  test('loads audio and reveals the two panes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Every line, right on time.')).toBeVisible();
    await expect(page.getByText('Drop an audio or video file')).toBeVisible();
    await expect(page.getByText('Upload an MP3')).toBeVisible();
    await expect(page.getByText('Start the playback')).toBeVisible();
    await expect(page.getByText('Click Annotate to create timed lyrics')).toBeVisible();

    await loadAudio(page);
    await expect(page.getByText('Plain lyrics')).toBeVisible();
  });

  test('loads an audio file dropped anywhere on the page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File([new Uint8Array([1, 2, 3, 4])], 'dropped.mp3', { type: 'audio/mpeg' }),
      );
      window.dispatchEvent(
        new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByText('Enter Manually')).toBeVisible();
  });

  test('rejects a non-media file dropped on the page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(['hello'], 'notes.txt', { type: 'text/plain' }));
      window.dispatchEvent(
        new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByText('That file type cannot be played')).toBeVisible();
    await expect(page.getByText('Drop an audio or video file')).toBeVisible();
  });

  test('loads a video file dropped anywhere on the page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File([new Uint8Array([1, 2, 3, 4])], 'clip.mp4', { type: 'video/mp4' }),
      );
      window.dispatchEvent(
        new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByText('Enter Manually')).toBeVisible();
  });

  test('allows annotating a blank line for an instrumental gap', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', '', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();
    await pausePlayback(page);
    await seekTo(page, 8);
    await page.waitForTimeout(150);

    // Give the blank line a timestamp via its inline editor.
    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await stamps.nth(1).click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:08.00');
    await field.press('Enter');

    await expect(page.getByTestId('raw-list').getByText('Blank line')).toBeVisible();
    await expect(stamps.nth(1)).toHaveText('00:08.00');

    // Export contains an empty timed line for the gap.
    await page.getByRole('button', { name: 'Copy timed lyrics' }).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('[00:08.00]');
  });

  test('annotates a blank line in the middle of the lyrics', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', '', 'Line two']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();

    // The blank gap is the next target rather than being skipped.
    await expect(page.getByTestId('next-line-banner').getByText('Blank line')).toBeVisible();

    await pausePlayback(page);
    await seekTo(page, 8);
    await page.waitForTimeout(150);
    await expect(annotate).toBeEnabled();
    await annotate.click();

    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.nth(1)).toHaveText('00:08.00');
  });

  test('annotates a trailing blank line after all lyrics', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', '']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();

    // The trailing blank line becomes the next target.
    await expect(page.getByTestId('next-line-banner').getByText('Blank line')).toBeVisible();
    await pausePlayback(page);
    await seekTo(page, 25);
    await page.waitForTimeout(150);
    await expect(annotate).toBeEnabled();
    await annotate.click();

    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.nth(2)).toHaveText('00:25.00');
  });

  test('starts a new project and returns to the upload screen', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);

    await page.getByRole('button', { name: 'New', exact: true }).click();
    await expect(page.getByText('Start a new project?')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'New project' }).click();

    await expect(page.getByText('Drop an audio or video file')).toBeVisible();
    await expect(page.getByText('Enter Manually')).toHaveCount(0);
  });

  test('confirms before clearing everything', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('Clear everything?')).toBeVisible();

    // Cancel keeps the lyrics.
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('raw-list').getByText('Line one')).toBeVisible();

    // Confirm clears everything and returns to the choose screen.
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('Enter Manually')).toBeVisible();
  });

  test('stops playback when clearing back to the add-lyrics screen', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);
    await play(page);

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear' }).click();

    await expect(page.getByText('Enter Manually')).toBeVisible();
    expect(await isPaused(page)).toBe(true);
  });

  test('imports a plain .txt file from the Add lyrics screen', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
    await expect(page.getByText('Import File')).toBeVisible();

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByText('Import File').click(),
    ]);
    await chooser.setFiles({
      name: 'lyrics.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain line one\nPlain line two\n'),
    });

    await expect(page.getByTestId('raw-list').getByText('Plain line one')).toBeVisible();
    await expect(page.getByTestId('raw-list').getByText('Plain line two')).toBeVisible();
  });

  test('imports an .srt file and rebuilds cue ends on export', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
    await expect(page.getByText('Import File')).toBeVisible();

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByText('Import File').click(),
    ]);
    // The end times (07 and 20) are intentionally never used by the import.
    await chooser.setFiles({
      name: 'lyrics.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from(
        '1\n00:00:05,000 --> 00:00:07,000\nHello\nworld\n\n2\n00:00:10,000 --> 00:00:20,000\nSecond line\n',
      ),
    });

    // Only start times survive, wrapped cue text is flattened, and the final
    // cue's end becomes a trailing blank line.
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.00');
    await expect(stampButtons(page).nth(2)).toHaveText('00:20.00');
    await expect(page.getByTestId('raw-list').getByText('Hello world')).toBeVisible();
    await expect(page.getByTestId('raw-list').getByText('Blank line')).toBeVisible();

    // Export ends cues at the next boundary; the trailing blank gives the last
    // cue its real end (20 s) instead of the +2 s fallback.
    await page.getByRole('button', { name: 'Export' }).click();
    const dialog = page.getByRole('dialog');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /SRT/ }).click(),
    ]);
    const content = await readFile((await download.path()) as string, 'utf8');
    expect(content).toBe(
      '1\n00:00:05,000 --> 00:00:10,000\nHello world\n\n2\n00:00:10,000 --> 00:00:20,000\nSecond line',
    );
  });

  test('confirms before importing over existing lyrics', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['My own line']);

    const importFile = {
      name: 'song.lrc',
      mimeType: 'text/plain',
      buffer: Buffer.from('[00:05.00]Imported line\n'),
    };

    await page.setInputFiles('input[accept*=".lrc"]', importFile);
    await expect(page.getByText('Replace existing lyrics?')).toBeVisible();

    // Cancel keeps the existing lyrics.
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('raw-list').getByText('My own line')).toBeVisible();

    // Replace loads the imported file.
    await page.setInputFiles('input[accept*=".lrc"]', importFile);
    await page.getByRole('dialog').getByRole('button', { name: 'Replace' }).click();
    await expect(page.getByTestId('raw-list').getByText('Imported line')).toBeVisible();
  });

  test('offers manual entry and LRCLIB search after upload', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
    await expect(page.getByText('Enter Manually')).toBeVisible();
    await expect(page.getByText('Search on LRCLIB')).toBeVisible();
  });

  test('suggests a search query from the uploaded file name', async ({ page }) => {
    await page.route('**/lrclib.net/api/search**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', {
      name: '01. Test Artist - Test Song.mp3',
      mimeType: 'audio/mpeg',
      buffer: silentWav(30),
    });
    await page.getByText('Search on LRCLIB').click();

    const chip = page.getByRole('button', { name: 'Test Artist - Test Song' });
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(page.getByRole('textbox', { name: 'Search LRCLIB' })).toHaveValue(
      'Test Artist - Test Song',
    );

    // The clear button empties the field again.
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByRole('textbox', { name: 'Search LRCLIB' })).toHaveValue('');
  });

  test('loads synced lyrics from an LRCLIB result', async ({ page }) => {
    await page.route('**/lrclib.net/api/search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SYNCED_RESULTS),
      }),
    );

    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
    await page.getByText('Search on LRCLIB').click();
    await page.getByRole('textbox', { name: 'Search LRCLIB' }).fill('test song');
    await expect(page.getByText('Synced', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Test Song/ }).click();

    await expect(page.getByText('Timed lyrics')).toBeVisible();
    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.first()).toHaveText('00:05.00');
  });

  test('loads plain lyrics from an LRCLIB result without synced lyrics', async ({ page }) => {
    await page.route('**/lrclib.net/api/search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PLAIN_RESULTS),
      }),
    );

    await page.goto('/');
    await page.setInputFiles('input[type="file"][accept*="audio"]', AUDIO);
    await page.getByText('Search on LRCLIB').click();
    await page.getByRole('textbox', { name: 'Search LRCLIB' }).fill('test song');
    await page.getByRole('button', { name: /Test Song/ }).click();

    await expect(page.getByTestId('raw-list').getByText('Plain one')).toBeVisible();
    await expect(page.getByTestId('raw-list').getByText('Plain two')).toBeVisible();
    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.first()).toHaveText('--:--.--');
  });

  test('annotates the next line and gates on playback position', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await expect(annotate).toBeDisabled();

    await play(page);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    expect(await timedStampCount(page)).toBe(1);

    // Seeking before the last timestamp disables annotate.
    await seekTo(page, 0.2);
    await expect(annotate).toBeDisabled();

    // Seeking past it re-enables annotate, which stamps the next line.
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    expect(await timedStampCount(page)).toBe(2);
  });

  test('re-annotates a deleted line that sits in a gap', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    await seekTo(page, 20);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    expect(await timedStampCount(page)).toBe(3);

    // Delete the middle line, leaving a gap between line 1 and line 3.
    await page.getByRole('button', { name: 'Line actions' }).nth(1).click();
    await page.getByRole('menuitem', { name: 'Delete timestamp' }).click();

    // Playback inside the gap must re-enable Annotate (it only needs to be past line 1).
    await seekTo(page, 15);
    await expect(annotate).toBeEnabled();
  });

  test('edits a timestamp inline and cascade-shifts the previous line', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();

    await stampButtons(page).nth(1).click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:00.50');
    await field.press('Enter');

    await expect(stampButtons(page).nth(1)).toHaveText('00:00.50');
    await expect(stampButtons(page).first()).toHaveText('00:00.49');
  });

  test('deletes a timestamp from the row menu and by clearing the field', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');

    // The row menu resets the line.
    await page.getByRole('button', { name: 'Line actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete timestamp' }).click();
    await expect(stampButtons(page).first()).toHaveText('--:--.--');

    // Clearing the field and committing also resets it.
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');

    await stampButtons(page).first().click();
    const field = page.locator('input:not([type])').first();
    await field.fill('');
    await field.press('Enter');
    await expect(stampButtons(page).first()).toHaveText('--:--.--');
  });

  test('keeps timestamps when inserting a blank line between timed lines', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);

    const setStamp = async (index: number, value: string) => {
      await stampButtons(page).nth(index).click();
      const field = page.locator('input:not([type])').first();
      await field.fill(value);
      await field.press('Enter');
    };
    await setStamp(0, '00:05.00');
    await setStamp(1, '00:10.00');
    await setStamp(2, '00:15.00');

    // Insert a blank line between line one and line two.
    await page.locator('textarea:not([readonly])').first().fill('Line one\n\nLine two\nLine three');

    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
    await expect(stampButtons(page).nth(1)).toHaveText('00:09.99');
    await expect(stampButtons(page).nth(2)).toHaveText('00:10.00');
    await expect(stampButtons(page).nth(3)).toHaveText('00:15.00');
  });

  test('leaves an inserted blank untimed when there is no room for it', async ({ page }) => {
    await loadAudio(page);
    await page.setInputFiles('input[accept*=".lrc"]', {
      name: 'song.lrc',
      mimeType: 'text/plain',
      buffer: Buffer.from('[00:05.00]Line one\n[00:05.01]Line two\n'),
    });
    await expect(page.getByTestId('raw-list').getByText('Line one')).toBeVisible();

    // The two lines are 10 ms apart, so the blank cannot fit between them.
    await page.locator('textarea:not([readonly])').first().fill('Line one\n\nLine two');

    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
    await expect(stampButtons(page).nth(1)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(2)).toHaveText('00:05.01');
  });

  test('keeps timestamps when editing and deleting lines', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);

    const setStamp = async (index: number, value: string) => {
      await stampButtons(page).nth(index).click();
      const field = page.locator('input:not([type])').first();
      await field.fill(value);
      await field.press('Enter');
    };
    await setStamp(0, '00:05.00');
    await setStamp(1, '00:10.00');
    await setStamp(2, '00:15.00');

    // Edit the first line and delete the second.
    await page.locator('textarea:not([readonly])').first().fill('Line one edited\nLine three');

    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
    await expect(stampButtons(page).nth(1)).toHaveText('00:15.00');
  });

  test('shifts a timestamp by ±50 ms', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await stampButtons(page).first().click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:05.00');
    await field.press('Enter');
    await expect(stampButtons(page).first()).toHaveText('00:05.00');

    await page.getByRole('button', { name: 'Shift +50 ms' }).first().click();
    await expect(stampButtons(page).first()).toHaveText('00:05.05');

    await page.getByRole('button', { name: 'Shift -50 ms' }).first().click();
    await expect(stampButtons(page).first()).toHaveText('00:05.00');
  });

  test('seeks to a line by clicking its text in the raw list', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await stampButtons(page).first().click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:07.00');
    await field.press('Enter');

    await pausePlayback(page);
    await seekTo(page, 1);
    await page.waitForTimeout(150);

    await page.getByTestId('raw-list').getByText('Line one').click();
    expect(await currentTime(page)).toBeCloseTo(7, 1);
  });

  test('changes playback speed in 5% steps', async ({ page }) => {
    await loadAudio(page);
    await expect(page.getByText('100%')).toBeVisible();

    await page.getByRole('button', { name: 'Increase speed' }).click();
    await expect(page.getByText('105%')).toBeVisible();

    await page.getByRole('button', { name: 'Decrease speed' }).click();
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('undo and redo from the app bar', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(stampButtons(page).first()).toHaveText('--:--.--');

    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');
  });

  test('jumps between timed lines with Ctrl+Arrow', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();

    const setStamp = async (index: number, value: string) => {
      await stampButtons(page).nth(index).click();
      const field = page.locator('input:not([type])').first();
      await field.fill(value);
      await field.press('Enter');
    };

    await setStamp(0, '00:05.00');
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();
    await setStamp(1, '00:10.00');

    await pausePlayback(page);
    await seekTo(page, 0);
    await page.waitForTimeout(150);

    const currentTime = () =>
      page.evaluate(() => {
        const handle = (window as unknown as { __lyricron?: { getTime: () => number } }).__lyricron;
        return handle?.getTime() ?? -1;
      });

    await page.keyboard.press('Control+ArrowRight');
    await expect.poll(currentTime).toBeCloseTo(5, 1);

    await page.waitForTimeout(150);
    await page.keyboard.press('Control+ArrowRight');
    await expect.poll(currentTime).toBeCloseTo(10, 1);

    await page.waitForTimeout(150);
    await page.keyboard.press('Control+ArrowLeft');
    await expect.poll(currentTime).toBeCloseTo(5, 1);

    // Just after a line starts, Ctrl+Left jumps to the previous line.
    await seekTo(page, 10.3);
    await page.waitForTimeout(150);
    await page.keyboard.press('Control+ArrowLeft');
    await expect.poll(currentTime).toBeCloseTo(5, 1);

    // Well into a line, Ctrl+Left restarts the current line.
    await seekTo(page, 11.5);
    await page.waitForTimeout(150);
    await page.keyboard.press('Control+ArrowLeft');
    await expect.poll(currentTime).toBeCloseTo(10, 1);
  });

  test('cycles the theme between system, light and dark', async ({ page }) => {
    await loadAudio(page);

    await expect(page.getByRole('button', { name: 'Theme: System' })).toBeVisible();
    await page.getByRole('button', { name: 'Theme: System' }).click();

    await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible();
    await page.getByRole('button', { name: 'Theme: Light' }).click();

    const darkBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(darkBackground).toBe('rgb(23, 23, 29)');

    await page.getByRole('button', { name: 'Theme: Dark' }).click();
    await expect(page.getByRole('button', { name: 'Theme: System' })).toBeVisible();
  });

  test('shows the keyboard shortcuts dialog', async ({ page }) => {
    await loadAudio(page);
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Keyboard shortcuts')).toBeVisible();
    await expect(dialog.getByText('Playback', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Annotate', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Timestamps', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Selection', { exact: true })).toBeVisible();
    await expect(dialog.getByText('History', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Help', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Play / Pause')).toBeVisible();
    await expect(dialog.getByText('Annotate the next line')).toBeVisible();
  });

  test('preview shows only timed lines and seeks on click', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);

    const annotate = page.getByRole('button', { name: 'Annotate' });
    await play(page);
    await annotate.click();
    await seekTo(page, 12);
    await expect(annotate).toBeEnabled();
    await annotate.click();

    await page.getByRole('button', { name: 'Preview view' }).click();
    const preview = page.getByTestId('preview-pane');
    await expect(preview.getByText('Line one')).toBeVisible();
    await expect(preview.getByText('Line two')).toBeVisible();
    await expect(preview.getByText('Line three')).toHaveCount(0);

    await preview.getByText('Line one').click();
    await page.waitForTimeout(200);
    expect(await currentTime(page)).toBeLessThan(5);
  });

  test('copies the generated LRC to the clipboard', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await page.getByRole('button', { name: 'Copy timed lyrics' }).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(/^\[\d{2}:\d{2}\.\d{2}\] Line one/);
  });

  test('copies plain lyrics from the plain pane', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await page.getByRole('button', { name: 'Copy plain lyrics' }).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe('Line one\nLine two');
  });

  test('exports an .lrc download from the export dialog', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await page.getByRole('button', { name: 'Export' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Export lyrics')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /LRC/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.lrc$/);
  });

  test('exports an .srt download from the export dialog', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);

    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await page.getByRole('button', { name: 'Export' }).click();
    const dialog = page.getByRole('dialog');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /SRT/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.srt$/);
  });

  test('confirms before leaving the page while editing', async ({ page }) => {
    const isUnloadPrevented = () =>
      page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      });

    await page.goto('/');
    expect(await isUnloadPrevented()).toBe(false);

    await loadAudio(page);
    expect(await isUnloadPrevented()).toBe(true);

    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByRole('button', { name: 'New project' }).click();
    expect(await isUnloadPrevented()).toBe(false);
  });

  test('prompts when pasting timed LRC and loads it as timed lyrics', async ({ page }) => {
    await loadAudio(page);

    await pasteIntoPlainField(page, '[00:05.00]Line one\n[00:10.00]Line two');
    await expect(page.getByText('Timed lyrics pasted')).toBeVisible();

    await page.getByRole('button', { name: 'Use timed' }).click();
    await expect(page.getByTestId('raw-list').getByText('Line one')).toBeVisible();
    await expect(page.getByTestId('raw-list').getByText('Line two')).toBeVisible();

    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.first()).toHaveText('00:05.00');
    await expect(stamps.nth(1)).toHaveText('00:10.00');
  });

  test('converts pasted timed LRC to plain text', async ({ page }) => {
    await loadAudio(page);

    await pasteIntoPlainField(page, '[00:05.00]Line one\n[00:10.00]Line two');
    await page.getByRole('button', { name: 'Use plain' }).click();

    await expect(page.getByTestId('raw-list').getByText('Line one')).toBeVisible();
    await expect(page.getByTestId('raw-list').getByText('Line two')).toBeVisible();
    const stamps = page.locator('button[title="Click to edit the timestamp"]');
    await expect(stamps.first()).toHaveText('--:--.--');
  });

  test('cancelling a pasted timed LRC leaves the lyrics untouched', async ({ page }) => {
    await loadAudio(page);

    await pasteIntoPlainField(page, '[00:05.00]Line one');
    await expect(page.getByText('Timed lyrics pasted')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('raw-list').getByText('Line one')).toHaveCount(0);
  });

  test('does not prompt when pasting plain lyrics', async ({ page }) => {
    await loadAudio(page);

    await pasteIntoPlainField(page, 'Hello\nWorld');
    await expect(page.getByText('Timed lyrics pasted')).toHaveCount(0);
  });

  test('shifts every timestamp by ±50 ms', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);
    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await stampButtons(page).first().click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:05.00');
    await field.press('Enter');

    await page.getByRole('button', { name: '50ms' }).first().click();
    await expect(stampButtons(page).first()).toHaveText('00:04.95');

    await page.getByRole('button', { name: '50ms' }).nth(1).click();
    await expect(stampButtons(page).first()).toHaveText('00:05.00');
  });

  test('sets a line to the current playback time', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);

    await play(page);
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    await page.getByRole('button', { name: 'Set to current time' }).click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');
  });

  test('toggles play/pause with the Space key', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);
    await page.locator('textarea:not([readonly])').blur();

    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  });

  test('annotates with the Enter key', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);
    await page.locator('textarea:not([readonly])').blur();

    await play(page);
    await page.keyboard.press('Enter');
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');
  });

  test('shifts the last timed line with [ and ] keys', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);
    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();

    await stampButtons(page).first().click();
    const field = page.locator('input:not([type])').first();
    await field.fill('00:05.00');
    await field.press('Enter');
    await page.locator('textarea:not([readonly])').blur();

    await page.keyboard.press(']');
    await expect(stampButtons(page).first()).toHaveText('00:05.05');

    await page.keyboard.press('[');
    await expect(stampButtons(page).first()).toHaveText('00:05.00');
  });

  test('shifts the highlighted line with Ctrl+[ and Ctrl+]', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);
    await play(page);
    await pausePlayback(page);

    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    await page.keyboard.press('Control+]');
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.05');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.00');

    await page.keyboard.press('Control+[');
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
  });

  test('selects a range from the row rail and shifts the selected timestamps together', async ({
    page,
  }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);
    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();

    const checkboxes = page.getByRole('checkbox', { name: /Select line/ });
    await checkboxes.nth(0).click();
    await expect(page.getByTestId('selection-count')).toHaveText('1 selected');

    await checkboxes.nth(1).click({ modifiers: ['Shift'] });
    await expect(page.getByTestId('selection-count')).toHaveText('2 selected');

    await page.getByRole('button', { name: 'Shift selected +50 ms' }).click();
    await expect(page.getByTestId('timestamp-pulse')).toHaveCount(2);
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.05');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.05');
    await expect(stampButtons(page).nth(2)).toHaveText('00:15.00');

    // Escape returns the pane header and leaves the selection behind.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('selection-count')).toHaveCount(0);
    await expect(page.getByText('Timed lyrics')).toBeVisible();
  });

  test('selects a range by dragging across lyric lines', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);
    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 0);
    await page.waitForTimeout(150);

    const rows = page.getByTestId('raw-list').locator('[data-index]');
    const first = (await rows.nth(0).boundingBox())!;
    const last = (await rows.nth(2).boundingBox())!;
    const x = first.x + first.width * 0.55;

    // Drag from the middle of the first lyric line down to the last one.
    await page.mouse.move(x, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, last.y + last.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect(page.getByTestId('selection-count')).toHaveText('3 selected');
    // The drag must not seek like a click on the line would.
    expect(await currentTime(page)).toBeCloseTo(0, 1);
  });

  test('extends the selection with Shift+Arrow and scopes [ and Delete to it', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);
    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    // Selection starts at the highlighted playback line.
    await page.keyboard.press('Shift+ArrowDown');
    await expect(page.getByTestId('selection-count')).toHaveText('2 selected');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(page.getByTestId('selection-count')).toHaveText('3 selected');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('selection-count')).toHaveCount(0);

    // The bracket keys now shift the selection instead of the last line.
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press(']');
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.05');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.05');
    await expect(stampButtons(page).nth(2)).toHaveText('00:15.00');

    // Delete clears the selected timestamps as a single undo step.
    await page.keyboard.press('Delete');
    await expect(stampButtons(page).nth(0)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(1)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(2)).toHaveText('00:15.00');

    await page.keyboard.press('Control+z');
    await expect(stampButtons(page).nth(0)).toHaveText('00:05.05');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.05');
  });

  test('selects all timed lines from the header menu and clears their timestamps', async ({
    page,
  }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);
    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();

    await page.getByRole('button', { name: 'Select lines' }).click();
    await page.getByRole('menuitem', { name: 'Select timed (3)' }).click();
    await expect(page.getByTestId('selection-count')).toHaveText('3 selected');

    await page.getByRole('button', { name: 'Clear timestamps' }).click();
    await expect(page.getByText('Cleared 3 timestamps')).toBeVisible();
    await expect(stampButtons(page).nth(0)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(1)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(2)).toHaveText('--:--.--');
  });

  test('aligns the selected block to the playhead', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);
    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:06.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 12);
    await page.waitForTimeout(150);

    const checkboxes = page.getByRole('checkbox', { name: /Select line/ });
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click({ modifiers: ['Shift'] });

    await page.getByRole('button', { name: 'Align first line to current time' }).click();
    await expect(stampButtons(page).nth(0)).toHaveText('00:12.00');
    await expect(stampButtons(page).nth(1)).toHaveText('00:13.00');
    await expect(stampButtons(page).nth(2)).toHaveText('00:15.00');
  });

  test('keeps the highlighted line selected when nudged past the playhead', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two', 'Line three']);
    await play(page);
    await pausePlayback(page);

    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await setStamp(page, 2, '00:15.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    // Jump to the second line, then nudge it later twice with the keyboard.
    await page.keyboard.press('Control+ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.press('Control+]');
    await page.keyboard.press('Control+]');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.10');

    // The row's +50 ms button keeps the same line highlighted too.
    await page.getByRole('button', { name: 'Shift +50 ms' }).nth(1).click();
    await page.keyboard.press('Control+]');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.20');

    await expect(stampButtons(page).nth(0)).toHaveText('00:05.00');
    await expect(stampButtons(page).nth(2)).toHaveText('00:15.00');
  });

  test('deletes the highlighted timestamp with Ctrl+Delete', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);
    await play(page);
    await pausePlayback(page);

    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    await page.keyboard.press('Control+Delete');
    await expect(stampButtons(page).nth(0)).toHaveText('--:--.--');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.00');
  });

  test('sets the highlighted line to the current time with Ctrl+Enter', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one', 'Line two']);
    await play(page);
    await pausePlayback(page);

    await setStamp(page, 0, '00:05.00');
    await setStamp(page, 1, '00:10.00');
    await page.locator('textarea:not([readonly])').blur();
    await seekTo(page, 6);
    await page.waitForTimeout(150);

    await page.keyboard.press('Control+Enter');
    await expect(stampButtons(page).nth(0)).toHaveText('00:06.00');
    await expect(stampButtons(page).nth(1)).toHaveText('00:10.00');
  });

  test('undoes and redoes with Ctrl+Z / Ctrl+Shift+Z', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);
    await play(page);
    await page.getByRole('button', { name: 'Annotate' }).click();
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');
    await page.locator('textarea:not([readonly])').blur();

    await page.keyboard.press('Control+z');
    await expect(stampButtons(page).first()).toHaveText('--:--.--');

    await page.keyboard.press('Control+Shift+z');
    await expect(stampButtons(page).first()).not.toHaveText('--:--.--');
  });

  test('seeks back and forward with the arrow keys', async ({ page }) => {
    await loadAudio(page);
    await pasteLyrics(page, ['Line one']);
    await page.locator('textarea:not([readonly])').blur();

    await seekTo(page, 10);
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => currentTime(page)).toBeCloseTo(5, 1);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => currentTime(page)).toBeCloseTo(10, 1);
  });
});
