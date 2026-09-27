import { Button, IconButton, Paper, Stack, Typography, alpha, styled } from '@mui/material';
import { fontSizes } from '../../theme/typography';

export const BarRoot = styled(Paper)({
  overflow: 'hidden',
});

export const TooltipTarget = styled('span')({
  display: 'inline-flex',
});

export const Spacer = styled('div')({
  width: 8,
});

export interface BannerProps {
  $done: boolean;
}

export const NextBanner = styled('div')<BannerProps>(({ theme, $done }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  paddingBottom: theme.spacing(1.25),
  minWidth: 0,
  backgroundColor: $done ? theme.palette.action.hover : alpha(theme.palette.primary.main, 0.08),
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up('md')]: {
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5),
  },
}));

export const NextLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$done',
})<BannerProps>(({ theme, $done }) => ({
  fontWeight: 700,
  letterSpacing: '0.1em',
  lineHeight: 1,
  color: $done ? theme.palette.text.secondary : theme.palette.primary.main,
}));

export const BannerSeparator = styled('div')(({ theme }) => ({
  width: 1,
  alignSelf: 'stretch',
  marginTop: theme.spacing(0.25),
  marginBottom: theme.spacing(0.25),
  backgroundColor: theme.palette.divider,
}));

export interface NextTextProps extends BannerProps {
  $blank: boolean;
}

export const NextText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$done' && prop !== '$blank',
})<NextTextProps>(({ theme, $done, $blank }) => ({
  fontWeight: 600,
  minWidth: 0,
  fontStyle: $blank ? 'italic' : undefined,
  color: $done ? theme.palette.text.secondary : theme.palette.text.primary,
}));

export const DesktopBody = styled('div')(({ theme }) => ({
  padding: theme.spacing(2.5),
}));

export const MobileBody = styled('div')(({ theme }) => ({
  padding: theme.spacing(1.5),
}));

export const TransportRow = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
}));

export const PlayButton = styled(Button)(({ theme }) => ({
  minWidth: 150,
  height: 52,
  borderRadius: Number(theme.shape.borderRadius) * 3,
  fontSize: fontSizes.body,
}));

export const AnnotateButton = styled(Button)(({ theme }) => ({
  minWidth: 150,
  height: 52,
  borderRadius: Number(theme.shape.borderRadius) * 3,
  fontSize: fontSizes.body,
}));

export const StepButton = styled(IconButton)({
  width: 48,
  height: 48,
});

export const ProgressWrapper = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const UtilsRow = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1.5),
}));

export const ControlGroup = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export const GroupLabel = styled(Typography)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  color: theme.palette.text.secondary,
}));

export const RateValue = styled(Typography)({
  minWidth: 44,
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
});

export const MobileTransportRow = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
}));

export const MobilePlayButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': { backgroundColor: theme.palette.primary.dark },
}));

export const AnnotateGrow = styled('span')({
  flex: 1,
  display: 'flex',
});

export const MobileAnnotateButton = styled(Button)({
  height: 44,
});

export const MoreButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));

export const MobileOptions = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));
