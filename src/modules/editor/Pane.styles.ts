import { IconButton, Paper, Typography, styled } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fontSizes } from '../../theme/typography';

export const PaneRoot = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
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

export const TooltipTarget = styled('span')({
  display: 'inline-flex',
});

export const CopyButton = styled(IconButton)({
  width: 32,
  height: 32,
});

export const CopyIcon = styled(ContentCopyIcon)({
  fontSize: fontSizes.iconSm,
});
