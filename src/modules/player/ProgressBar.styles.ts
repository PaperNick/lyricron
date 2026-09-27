import { Slider, Stack, Typography, styled } from '@mui/material';

export const Root = styled(Stack)({
  alignItems: 'center',
});

export const Time = styled(Typography)({
  fontVariantNumeric: 'tabular-nums',
  minWidth: 40,
});

export const Duration = styled(Time)({
  textAlign: 'right',
});

export const Seek = styled(Slider)(({ theme }) => ({
  flex: 1,
  '& .MuiSlider-mark': {
    width: 2,
    height: 8,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'currentColor',
    opacity: 0.5,
  },
}));
