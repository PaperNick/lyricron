import { alpha, styled } from '@mui/material';
import { keyframes } from '@emotion/react';
import type { LinePulseDirection } from '../../types';
import { fontFamilies, fontSizes } from '../../theme/typography';

export const TimestampField = styled('input')(({ theme }) => ({
  width: 82,
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.label,
  textAlign: 'center',
  border: '1px solid',
  borderColor: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  outline: 'none',
}));

export const TimestampWrap = styled('span')({
  position: 'relative',
  display: 'inline-flex',
  flexShrink: 0,
});

export const TimestampButton = styled('button')<{ $empty: boolean }>(({ theme, $empty }) => ({
  width: 82,
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.label,
  textAlign: 'center',
  color: $empty ? theme.palette.text.disabled : theme.palette.text.secondary,
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
}));

const flash = (color: string) =>
  keyframes({
    from: { backgroundColor: alpha(color, 0.5) },
    to: { backgroundColor: alpha(color, 0) },
  });

const PULSE_SLOT: Record<LinePulseDirection, 'success' | 'error' | 'info'> = {
  later: 'success',
  earlier: 'error',
  now: 'info',
};

export const TimestampPulse = styled('span')<{ $direction: LinePulseDirection }>(
  ({ theme, $direction }) => ({
    position: 'absolute',
    inset: 0,
    borderRadius: theme.shape.borderRadius,
    pointerEvents: 'none',
    animation: `${flash(theme.palette[PULSE_SLOT[$direction]].main)} 700ms ease-out`,
    '@media (prefers-reduced-motion: reduce)': { animationDuration: '240ms' },
  }),
);
