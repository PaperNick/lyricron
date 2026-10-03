import { alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';
import { GUTTER, LINE_HEIGHT, RowSurface } from './Pane.styles';

export const MirrorWrapper = styled('div')({
  position: 'relative',
  minHeight: '100%',
});

export const Mirror = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
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
  left: 0,
  top: 0,
  width: GUTTER - 10,
  textAlign: 'right',
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
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)} ${theme.spacing(0.5)} 48px`,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  '&::placeholder': { color: theme.palette.text.disabled },
}));
