import { IconButton, Typography, alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';
import { PaneScrollArea, RowSurface } from './Pane.styles';

export const ListRoot = styled(PaneScrollArea)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

export interface RowProps {
  $next: boolean;
  $active: boolean;
}

export const Row = styled(RowSurface, {
  shouldForwardProp: (prop) => prop !== '$next' && prop !== '$active',
})<RowProps>(({ theme, $next, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  paddingTop: theme.spacing(0.25),
  paddingBottom: theme.spacing(0.25),
  backgroundColor: $next
    ? alpha(theme.palette.primary.main, 0.08)
    : $active
      ? theme.palette.action.hover
      : 'transparent',
}));

export const RowActions = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
});

export const RowActionButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.375),
  fontSize: fontSizes.iconSm,
}));

export interface LineTextProps {
  $blank: boolean;
  $clickable: boolean;
}

export const LineText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$blank' && prop !== '$clickable',
})<LineTextProps>(({ theme, $blank, $clickable }) => ({
  flex: 1,
  minWidth: 0,
  fontStyle: $blank ? 'italic' : undefined,
  color: $blank ? theme.palette.text.secondary : undefined,
  cursor: $clickable ? 'pointer' : undefined,
  '&:hover': $clickable ? { textDecoration: 'underline' } : undefined,
}));
