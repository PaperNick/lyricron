/**
 * Keyboard shortcuts, configurable via `.env` (Vite env vars). Values are
 * `KeyboardEvent.code` strings, e.g. `Space`, `Enter`, `KeyA`, `ArrowLeft`.
 */
const env = import.meta.env;

function read(value: string | undefined, fallback: string): string {
  return value && value.trim() !== '' ? value.trim() : fallback;
}

export const SHORTCUTS = {
  playPause: read(env.VITE_SHORTCUT_PLAY_PAUSE, 'Space'),
  annotate: read(env.VITE_SHORTCUT_ANNOTATE, 'Enter'),
  undo: read(env.VITE_SHORTCUT_UNDO, 'Backspace'),
  shiftEarlier: read(env.VITE_SHORTCUT_SHIFT_EARLIER, 'BracketLeft'),
  shiftLater: read(env.VITE_SHORTCUT_SHIFT_LATER, 'BracketRight'),
  delete: read(env.VITE_SHORTCUT_DELETE, 'Delete'),
  seekBack: read(env.VITE_SHORTCUT_SEEK_BACK, 'ArrowLeft'),
  seekForward: read(env.VITE_SHORTCUT_SEEK_FORWARD, 'ArrowRight'),
  selectUp: read(env.VITE_SHORTCUT_SELECT_UP, 'ArrowUp'),
  selectDown: read(env.VITE_SHORTCUT_SELECT_DOWN, 'ArrowDown'),
  deselect: read(env.VITE_SHORTCUT_DESELECT, 'Escape'),
  help: read(env.VITE_SHORTCUT_HELP, 'Slash'),
};

/** Human-friendly label for a `KeyboardEvent.code` value. */
export function shortcutLabel(code: string): string {
  if (code === 'Space') {
    return 'Space';
  }
  if (code.startsWith('Key')) {
    return code.slice(3);
  }
  if (code.startsWith('Digit')) {
    return code.slice(5);
  }
  const symbols: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Escape: 'Esc',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
  };
  return symbols[code] ?? code;
}
