export interface LyricLine {
  id: string;
  text: string;
  time: number | null;
}

export type LinePulseDirection = 'earlier' | 'later' | 'now';

/** Transient highlight shown on a timestamp after an action changes it. */
export interface LinePulse {
  index: number;
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

export interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}
