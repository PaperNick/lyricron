import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { colors } from './theme/colors';
import type { PillPalette } from './theme/colors';
import { baseFontSize, fontFamilies } from './theme/typography';

declare module '@mui/material/styles' {
  interface Palette {
    pill: PillPalette;
  }
  interface PaletteOptions {
    pill?: PillPalette;
  }
}

export type ThemeMode = 'system' | 'light' | 'dark';

export function createAppTheme(mode: PaletteMode) {
  const palette = colors[mode];

  return createTheme({
    palette: {
      mode,
      primary: { main: palette.primary },
      success: { main: palette.success },
      background: {
        default: palette.backgroundDefault,
        paper: palette.backgroundPaper,
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary,
        disabled: palette.textDisabled,
      },
      divider: palette.divider,
      action: {
        hover: palette.actionHover,
        selected: palette.actionSelected,
      },
      pill: palette.pill,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: fontFamilies.body,
      fontSize: baseFontSize,
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiTooltip: {
        defaultProps: {
          // Keep tooltips from intercepting clicks aimed behind them.
          disableInteractive: true,
          // Avoid flicker when sweeping across controls.
          enterDelay: 400,
          leaveDelay: 0,
        },
      },
    },
  });
}
