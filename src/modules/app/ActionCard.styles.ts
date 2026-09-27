import { styled } from '@mui/material';

export const Card = styled('div')(({ theme }) => ({
  flex: 1,
  width: '100%',
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  border: '2px dashed',
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
