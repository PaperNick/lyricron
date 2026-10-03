import { styled } from '@mui/material';

export interface CardProps {
  $solidBorder?: boolean;
}

export const Card = styled('div', {
  shouldForwardProp: (prop) => prop !== '$solidBorder',
})<CardProps>(({ theme, $solidBorder }) => ({
  flex: 1,
  width: '100%',
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  border: $solidBorder ? '2px solid' : '2px dashed',
  borderColor: theme.palette.divider,
  borderRadius: Number(theme.shape.borderRadius) * 3,
  backgroundColor: theme.palette.background.paper,
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
