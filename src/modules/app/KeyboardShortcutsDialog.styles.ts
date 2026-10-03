import { DialogTitle, Stack, Typography, styled } from '@mui/material';
import { fontFamilies, fontSizes } from '../../theme/typography';

export const Header = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

export const Row = styled(Stack)({
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const Key = styled('kbd')(({ theme }) => ({
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.label,
  whiteSpace: 'nowrap',
  backgroundColor: theme.palette.action.hover,
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderBottomWidth: 2,
  borderRadius: theme.shape.borderRadius,
}));

export const Description = styled(Typography)({
  textAlign: 'right',
});

export const GroupTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.text.secondary,
}));
