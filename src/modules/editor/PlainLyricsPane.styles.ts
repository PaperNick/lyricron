import { alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';
import { LINE_HEIGHT, RowSurface } from './Pane.styles';

/** Line-number gutter: inset + column width + 1px gap before the lyric text. */
const NUMBER_INSET = 9;
const NUMBER_WIDTH = 30;
const GUTTER = NUMBER_INSET + NUMBER_WIDTH + 1;

export const MirrorWrapper = styled('div')({
  position: 'relative',
  minHeight: '100%',
});

export const Mirror = styled('div')(({ theme }) => ({
  // Matches the pane title and timestamp insets.
  padding: theme.spacing(0.5),
  pointerEvents: 'none',
}));

export interface LineRowProps {
  $hovered: boolean;
  $active: boolean;
  $focused: boolean;
}

export const LineRow = styled(RowSurface, {
  shouldForwardProp: (prop) => prop !== '$hovered' && prop !== '$active' && prop !== '$focused',
})<LineRowProps>(({ theme, $hovered, $active, $focused }) => ({
  position: 'relative',
  lineHeight: `${LINE_HEIGHT}px`,
  paddingLeft: GUTTER,
  backgroundColor: $hovered
    ? alpha(theme.palette.primary.main, $focused ? 0.12 : 0.2)
    : $active
      ? theme.palette.action.selected
      : 'transparent',
}));

export const AccentBar = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 3,
  bottom: 3,
  width: 3,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.primary.main,
}));

export interface GutterNumberProps {
  $hovered: boolean;
}

export const GutterNumber = styled('span')<GutterNumberProps>(({ theme, $hovered }) => ({
  position: 'absolute',
  left: NUMBER_INSET,
  top: 0,
  width: NUMBER_WIDTH,
  textAlign: 'left',
  fontSize: fontSizes.caption,
  lineHeight: `${LINE_HEIGHT}px`,
  color: $hovered ? theme.palette.primary.main : theme.palette.text.disabled,
  userSelect: 'none',
}));

export const MirrorText = styled('div')({
  visibility: 'hidden',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  fontSize: fontSizes.body,
  fontFamily: 'inherit',
});

export const Editor = styled('textarea')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  resize: 'none',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.text.primary,
  fontFamily: 'inherit',
  fontSize: fontSizes.body,
  lineHeight: `${LINE_HEIGHT}px`,
  // Mirror inset + gutter, so the overlay text lines up with the mirror.
  padding: `${theme.spacing(0.5)} ${theme.spacing(0.5)} ${theme.spacing(0.5)} calc(${GUTTER}px + ${theme.spacing(0.5)})`,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  '&::placeholder': { color: theme.palette.text.disabled },
}));
