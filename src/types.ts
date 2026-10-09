export interface LyricLine {
  id: string;
  text: string;
  time: number | null;
}

export type LinePulseDirection = 'earlier' | 'later' | 'now';

/** Transient highlight shown on timestamps after an action changes them. */
export interface LinePulse {
  indices: number[];
  direction: LinePulseDirection;
  /** Bumped per action so repeating one direction retriggers the animation. */
  nonce: number;
}

export interface SavedProject {
  audioName: string | null;
  lines: LyricLine[];
}

export type MobileTab = 'lyrics' | 'timed';

export type ExportFormat = 'lrc' | 'srt';

/** Availability of lyrics embedded in the loaded audio file's ID3 tags. */
export type EmbeddedLyricsStatus = 'unsupported' | 'checking' | 'none' | 'available';

export interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}
