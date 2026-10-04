import { IconButton, Paper, Typography, styled } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fontSizes } from '../../theme/typography';

export const LINE_HEIGHT = 36;

/** Shared pane padding; the row gutter math builds on it. */
export const PANE_PADDING = 3.5;

export const PaneRoot = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(PANE_PADDING),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
}));

export const Header = styled('div')<{ $inset?: number }>(({ theme, $inset = 0 }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  minHeight: 36,
  paddingLeft: theme.spacing($inset),
}));

export const Title = styled(Typography)({
  fontWeight: 700,
});

export const PaneScrollArea = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  position: 'relative',
});

export const RowSurface = styled('div')(({ theme }) => ({
  minHeight: LINE_HEIGHT,
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color .12s ease',
}));

export const HeaderIconButton = styled(IconButton)({
  width: 32,
  height: 32,
});

export const CopyIcon = styled(ContentCopyIcon)({
  fontSize: fontSizes.iconSm,
});
