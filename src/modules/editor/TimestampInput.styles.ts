import { styled } from '@mui/material';
import { fontFamilies, fontSizes } from '../../theme/typography';

export const TimestampField = styled('input')(({ theme }) => ({
  width: 82,
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.label,
  border: '1px solid',
  borderColor: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  outline: 'none',
}));

export const TimestampButton = styled('button')<{ $empty: boolean }>(({ theme, $empty }) => ({
  width: 82,
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.label,
  textAlign: 'left',
  color: $empty ? theme.palette.text.disabled : theme.palette.text.secondary,
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
}));
