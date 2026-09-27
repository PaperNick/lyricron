import { Typography, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';

export const Pane = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1),
  paddingBottom: '45%',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}));

export const Empty = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'grid',
  placeItems: 'center',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

export const Line = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>(({ theme, $active }) => ({
  marginBottom: theme.spacing(1.5),
  fontWeight: 700,
  fontSize: fontSizes.subtitle,
  lineHeight: 1.3,
  cursor: 'pointer',
  color: $active ? theme.palette.text.primary : theme.palette.text.disabled,
  opacity: $active ? 1 : 0.55,
  transition: 'color .2s ease, opacity .2s ease',
  '&:hover': { opacity: $active ? 1 : 0.8 },
}));
