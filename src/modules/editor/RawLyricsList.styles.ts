import { Typography, alpha, styled } from '@mui/material';

export const ListRoot = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

export interface RowProps {
  $next: boolean;
  $active: boolean;
}

export const Row = styled('div')<RowProps>(({ theme, $next, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  paddingTop: theme.spacing(0.25),
  paddingBottom: theme.spacing(0.25),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: $next
    ? alpha(theme.palette.primary.main, 0.08)
    : $active
      ? theme.palette.action.hover
      : 'transparent',
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

export const TooltipTarget = styled('span')({
  display: 'inline-flex',
});
