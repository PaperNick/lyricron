import { ToggleButtonGroup, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';

export const ToggleGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  height: 32,
  '& .MuiToggleButton-root': {
    height: 32,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: theme.spacing(1.25),
    paddingRight: theme.spacing(1.25),
    fontSize: fontSizes.label,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    '&.Mui-selected': { color: theme.palette.primary.main },
  },
}));

export const Spacer = styled('div')({
  flex: 1,
});
