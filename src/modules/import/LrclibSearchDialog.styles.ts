import { Chip, DialogTitle, List, ListItemButton, Stack, Typography, styled } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { fontSizes } from '../../theme/typography';

export type PillTone = 'duration' | 'synced' | 'plain' | 'instrumental' | 'none';

function pillToneStyles(theme: Theme, tone: PillTone) {
  const { bg, fg } = theme.palette.pill[tone];
  return { backgroundColor: bg, color: fg };
}

export const Header = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

export const Pill = styled('span')<{ $tone: PillTone }>(({ theme, $tone }) => ({
  padding: `${theme.spacing(0.125)} ${theme.spacing(0.75)}`,
  borderRadius: theme.shape.borderRadius,
  fontSize: fontSizes.caption,
  fontWeight: 700,
  lineHeight: 1.5,
  ...pillToneStyles(theme, $tone),
}));

export const SuggestionRow = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  flexWrap: 'nowrap',
  marginTop: theme.spacing(1),
}));

export const SuggestionLabel = styled(Typography)({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const SuggestionChip = styled(Chip)({
  minWidth: 0,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export const Results = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  minHeight: 220,
}));

export const Loading = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const ResultList = styled(List)({
  paddingTop: 0,
  paddingBottom: 0,
});

export const ResultButton = styled(ListItemButton)(({ theme }) => ({
  alignItems: 'flex-start',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

export const ResultBody = styled('div')({
  minWidth: 0,
  width: '100%',
});

export const ResultTitle = styled(Typography)({
  fontWeight: 700,
});

export const PillRow = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  alignItems: 'center',
}));

export const ResultMeta = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));
