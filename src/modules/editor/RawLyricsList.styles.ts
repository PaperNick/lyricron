import { Checkbox, IconButton, Typography, alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';
import { PaneScrollArea, RowSurface } from './Pane.styles';

export const ListRoot = styled(PaneScrollArea)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

export interface RowProps {
  $next: boolean;
  $active: boolean;
  $selected: boolean;
  $selectionStart: boolean;
  $selectionEnd: boolean;
  $selecting: boolean;
}

export const Row = styled(RowSurface, {
  shouldForwardProp: (prop) => !String(prop).startsWith('$'),
})<RowProps>(({ theme, $next, $active, $selected, $selectionStart, $selectionEnd, $selecting }) => {
  // Selected rows form one rounded block, tinted like the plain pane hover.
  const selectedRadius = $selectionStart
    ? $selectionEnd
      ? theme.shape.borderRadius
      : `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`
    : $selectionEnd
      ? `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`
      : 0;
  const revealCheckbox = { opacity: 1 };

  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    paddingTop: theme.spacing(0.25),
    paddingBottom: theme.spacing(0.25),
    backgroundColor: $selected
      ? alpha(theme.palette.primary.main, 0.2)
      : $next
        ? alpha(theme.palette.primary.main, 0.08)
        : $active
          ? theme.palette.action.hover
          : 'transparent',
    borderRadius: $selected ? selectedRadius : undefined,
    WebkitTouchCallout: 'none',
    '& .selection-checkbox': $selecting ? revealCheckbox : undefined,
    '&:hover .selection-checkbox, &:focus-within .selection-checkbox': revealCheckbox,
  };
});

export const SelectRail = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  flexShrink: 0,
  cursor: 'pointer',
  userSelect: 'none',
});

export const SelectCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: 0,
  width: 16,
  height: 16,
  opacity: 0,
  transition: 'opacity .12s ease',
  color: theme.palette.text.disabled,
  '&.Mui-checked': {
    color: theme.palette.primary.main,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
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
