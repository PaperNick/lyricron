export interface PillColor {
  bg: string;
  fg: string;
}

export interface PillPalette {
  duration: PillColor;
  synced: PillColor;
  plain: PillColor;
  instrumental: PillColor;
  none: PillColor;
}

export interface AppColors {
  primary: string;
  success: string;
  backgroundDefault: string;
  backgroundPaper: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  divider: string;
  actionHover: string;
  actionSelected: string;
  pill: PillPalette;
}

// Brand hue is a single indigo-violet ramp (see public/favicon.svg), tuned separately
// per mode for contrast: darker/saturated on light backgrounds, lighter/soft on dark ones.
export const colors: Record<'light' | 'dark', AppColors> = {
  light: {
    primary: '#7c3aed',
    success: '#16a34a',
    backgroundDefault: '#f6f6fa',
    backgroundPaper: '#ffffff',
    textPrimary: '#16161f',
    textSecondary: '#5c5f6e',
    textDisabled: 'rgba(22, 22, 31, 0.38)',
    divider: 'rgba(22, 22, 31, 0.1)',
    actionHover: 'rgba(22, 22, 31, 0.04)',
    actionSelected: 'rgba(22, 22, 31, 0.08)',
    pill: {
      duration: { bg: '#7c3aed', fg: '#ffffff' },
      synced: { bg: '#16a34a', fg: '#ffffff' },
      plain: { bg: '#3f3f46', fg: '#ffffff' },
      instrumental: { bg: '#a1a1aa', fg: '#ffffff' },
      none: { bg: '#e4e4e9', fg: '#5c5f6e' },
    },
  },
  dark: {
    primary: '#a78bfa',
    success: '#4ade80',
    backgroundDefault: '#17171d',
    backgroundPaper: '#202028',
    textPrimary: '#ececf2',
    textSecondary: '#9a9dae',
    textDisabled: 'rgba(236, 238, 242, 0.42)',
    divider: 'rgba(255, 255, 255, 0.11)',
    actionHover: 'rgba(255, 255, 255, 0.06)',
    actionSelected: 'rgba(255, 255, 255, 0.13)',
    pill: {
      duration: { bg: '#a78bfa', fg: '#17101f' },
      synced: { bg: '#4ade80', fg: '#0c2013' },
      plain: { bg: '#33333d', fg: '#ececf2' },
      instrumental: { bg: '#4b4c57', fg: '#ececf2' },
      none: { bg: '#1c1c23', fg: '#9a9dae' },
    },
  },
};

/**
 * Fixed indigo -> sky gradient used by the logo mark. Kept separate from the
 * light/dark palette so the mark looks identical in every theme.
 */
export const brandGradient = {
  from: '#a78bfa',
  to: '#38bdf8',
} as const;
