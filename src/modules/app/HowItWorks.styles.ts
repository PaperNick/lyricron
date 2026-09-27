import { Stack, Typography, alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';
import { compactPhone } from '../../theme/responsive';

export const Root = styled(Stack)({
  alignItems: 'center',
  width: '100%',
  maxWidth: 900,
});

export const Heading = styled(Typography)({
  fontWeight: 700,
  textAlign: 'center',
});

export const Steps = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(2),
  width: '100%',
  [compactPhone]: {
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing(4),
  },
}));

export const Step = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(1.5),
  [compactPhone]: {
    gap: theme.spacing(1),
  },
}));

export const StepBadge = styled('div')(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: fontSizes.subtitle,
  [compactPhone]: {
    width: 40,
    height: 40,
  },
  [theme.breakpoints.up('md')]: {
    width: 60,
    height: 60,
    fontSize: fontSizes.heading,
  },
}));
