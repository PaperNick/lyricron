/// <reference types="vite/client" />

declare const __REVISION__: string;

interface ImportMetaEnv {
  readonly VITE_SHORTCUT_PLAY_PAUSE?: string;
  readonly VITE_SHORTCUT_ANNOTATE?: string;
  readonly VITE_SHORTCUT_UNDO?: string;
  readonly VITE_SHORTCUT_SHIFT_EARLIER?: string;
  readonly VITE_SHORTCUT_SHIFT_LATER?: string;
  readonly VITE_SHORTCUT_DELETE?: string;
  readonly VITE_SHORTCUT_SEEK_BACK?: string;
  readonly VITE_SHORTCUT_SEEK_FORWARD?: string;
  readonly VITE_SHORTCUT_HELP?: string;
}
