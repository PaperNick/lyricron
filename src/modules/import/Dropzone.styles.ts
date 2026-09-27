import { Stack, Typography, styled } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { fontSizes } from '../../theme/typography';
import { compactPhone } from '../../theme/responsive';

export const DropArea = styled('div')<{ $dragging: boolean }>(({ theme, $dragging }) => ({
  width: '100%',
  maxWidth: 760,
  minHeight: 200,
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  border: '2px dashed',
  borderColor: $dragging ? theme.palette.primary.main : theme.palette.divider,
  borderRadius: Number(theme.shape.borderRadius) * 4,
  backgroundColor: $dragging ? theme.palette.action.hover : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all .15s ease',
  [compactPhone]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 320,
    padding: theme.spacing(6),
  },
}));

export const DropContent = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  pointerEvents: 'none',
  gap: theme.spacing(2),
  [compactPhone]: {
    gap: theme.spacing(1),
  },
}));

export const UploadIcon = styled(UploadFileIcon)(({ theme }) => ({
  fontSize: '3rem',
  [compactPhone]: {
    fontSize: '2.25rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: fontSizes.iconXl,
  },
}));

export const DropTitle = styled(Typography)({
  fontWeight: 700,
});
