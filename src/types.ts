export interface LyricLine {
  id: string;
  text: string;
  time: number | null;
}

export interface SavedProject {
  audioName: string | null;
  lines: LyricLine[];
}

export type MobileTab = 'lyrics' | 'timed';

export interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}
