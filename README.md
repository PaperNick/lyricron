# Lyricron

**Every line, right on time.**

[![CI](https://github.com/PaperNick/lyricron/actions/workflows/ci.yml/badge.svg)](https://github.com/PaperNick/lyricron/actions/workflows/ci.yml)

Create perfectly timed lyrics while you listen: play a track, tap along, and export a ready-to-use `.lrc` file. Load a local audio (or video) file, add the lyrics, then press **Annotate** as the song plays to stamp each line.

**100% private and works offline**: no account, no upload, nothing ever leaves your device. Everything (including fonts) runs locally in the browser.

![Lyricron's desktop editor mid-annotation, with the Annotate button active for the next line](https://github.com/user-attachments/assets/e55cd718-9bd3-4107-accf-b89a0dfc8111)

## Support

Lyricron is free and open source. If it saves you time, you can support ongoing development here:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/papernick)

## Features

- Load media: drop an audio or video file anywhere on the page, or use the file picker (only the audio plays).
- Add lyrics: type or paste them by hand, import a `.txt`/`.lrc` file, or fetch synced lyrics from [LRCLIB](https://lrclib.net).
- Paste timed LRC: pasting timed lyrics into the plain-text field detects them and asks whether to load them as timed lyrics or convert to plain text.
- Annotate: stamp each line as the song plays, with blank-line support for instrumental gaps.
- Fine-tune: inline timestamp editing, ±50 ms nudging per line, shift-all, and undo/redo.
- Bulk edit: select a range of lines to shift them together, realign them to the playhead, or clear their timestamps.
- Keyboard-driven: annotate, play/pause, seek, and jump between timed lines without the mouse (see Shortcuts below).
- Output: preview mode, per-line timestamps, and copy/export to `.lrc`.
- Extras: playback speed control, dark/light/system theme, and project auto-save.

## Tech stack

- React 19 + TypeScript
- MUI with styled components
- Playwright
- oxlint

## Getting started

Requires Node.js (see [`.nvmrc`](./.nvmrc)).

```bash
nvm use
npm ci
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check (`tsc -b`) and build for production.
- `npm run lint`: lint with oxlint.
- `npm run test`: run unit tests, then end-to-end tests.
- `npm run test:unit`: run Vitest unit tests only.
- `npm run test:e2e`: run Playwright end-to-end tests only.

## Keyboard shortcuts

Defaults, configurable via `.env` (see `.env.example`):

**Playback**

- `Space`: Play / Pause.
- `←`: Seek back 5 s.
- `→`: Seek forward 5 s.
- `Shift + ←`: Seek back 1 s.
- `Shift + →`: Seek forward 1 s.
- `Ctrl/⌘ + ←`: Previous timed line.
- `Ctrl/⌘ + →`: Next timed line.

**Annotate**

- `Enter`: Annotate the next line.
- `Ctrl/⌘ + Enter`: Set the highlighted line to the current time.

**Timestamps**

- `[`: Shift the last line -50 ms.
- `]`: Shift the last line +50 ms.
- `Ctrl/⌘ + [`: Shift the highlighted line -50 ms.
- `Ctrl/⌘ + ]`: Shift the highlighted line +50 ms.
- `Delete`: Delete the last timestamp.
- `Ctrl/⌘ + Delete`: Delete the highlighted line's timestamp.

**Selection**

Select lines with the checkbox rail in the left margin (click, Shift-click for a range, or drag across lines), or select all/timed/untimed from the list icon in the pane header.

- `Shift + ↑`: Extend the selection up.
- `Shift + ↓`: Extend the selection down.
- `Esc`: Clear the selection.
- `[`: Shift the selected lines -50 ms.
- `]`: Shift the selected lines +50 ms.
- `Delete`: Clear the selected timestamps.

**History**

- `Backspace`: Undo.
- `Ctrl/⌘ + Z`: Undo.
- `Ctrl/⌘ + Shift + Z`: Redo.
- `Ctrl/⌘ + Y`: Redo.

To customize, copy `.env.example` to `.env` (or `.env.local`) and set any `VITE_SHORTCUT_*` value to a `KeyboardEvent.code` string (for example `KeyA`, `Space`, `ArrowLeft`), then restart the dev server. Empty values fall back to the defaults above.

## Testing

Unit tests cover the pure logic in `src/lib`, and end-to-end tests drive the full app in a real browser. See the scripts above to run them.

## Privacy

Lyricron never sends your audio, lyrics, or timestamps anywhere. It is a static single-page app with no backend, no analytics, and no external requests (fonts are bundled locally).
