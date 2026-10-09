import { alpha, styled } from '@mui/material';

export interface CardProps {
  $solidBorder?: boolean;
  $highlighted?: boolean;
}

export const Card = styled('div', {
  shouldForwardProp: (prop) => prop !== '$solidBorder' && prop !== '$highlighted',
})<CardProps>(({ theme, $solidBorder, $highlighted }) => ({
  flex: 1,
  width: '100%',
  maxWidth: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  border: $solidBorder || $highlighted ? '2px solid' : '2px dashed',
  borderColor: $highlighted ? theme.palette.primary.main : theme.palette.divider,
  borderRadius: Number(theme.shape.borderRadius) * 3,
  backgroundColor: $highlighted
    ? alpha(theme.palette.primary.main, 0.06)
    : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all .15s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

export const CardBody = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  width: '100%',
  minWidth: 0,
}));
