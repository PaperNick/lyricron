import {
  AppBar,
  Button,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  alpha,
  styled,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { BrandMark } from './modules/app/BrandMark';
import { fontSizes } from './theme/typography';
import { compactPhone } from './theme/responsive';

export const Root = styled('div')(({ theme }) => ({
  height: '100dvh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
}));

export const TopBar = styled(AppBar)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const NavToolbar = styled(Toolbar)(({ theme }) => ({
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  width: '100%',
  maxWidth: 1536,
  marginLeft: 'auto',
  marginRight: 'auto',
}));

export const BrandRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginRight: theme.spacing(1),
  minWidth: 0,
}));

export const BrandIcon = styled(BrandMark)({
  width: 20,
  height: 20,
  flexShrink: 0,
});

export const Brand = styled(Typography)({
  fontWeight: 700,
  minWidth: 0,
  cursor: 'default',
  userSelect: 'none',
});

export const NewButton = styled(Button)({
  flexShrink: 0,
});

export const NavSpacer = styled('div')({
  flex: 1,
});

export const NavDivider = styled('div')(({ theme }) => ({
  borderLeft: `1px solid ${theme.palette.divider}`,
  height: 28,
  marginLeft: theme.spacing(0.5),
  marginRight: theme.spacing(0.5),
}));

export const Content = styled('div')({
  flex: 1,
  minHeight: 0,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const ContentInner = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  width: '100%',
  maxWidth: 1536,
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
  },
}));

export const UploadScreen = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  overflowY: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [compactPhone]: {
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(6),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
  },
}));

export const Hero = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(1.5),
  maxWidth: 720,
  flex: '0 0 auto',
  [compactPhone]: {
    gap: theme.spacing(1),
  },
}));

export const HeroBrandRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

export const HeroBrandIcon = styled(BrandMark)({
  width: 40,
  height: 40,
  flexShrink: 0,
  [compactPhone]: {
    width: 32,
    height: 32,
  },
});

export const HeroBrand = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: theme.palette.text.primary,
  cursor: 'default',
  userSelect: 'none',
}));

export const Tagline = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export const HeroDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 560,
}));

export const PrivacyNote = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
}));

export const PrivacyIcon = styled(CheckCircleIcon)(({ theme }) => ({
  fontSize: fontSizes.iconSm,
  color: theme.palette.success.main,
}));

export const CenterRow = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  flex: '0 0 auto',
});

export const DropzoneArea = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
  flex: '0 0 auto',
}));

export const ChooseScreen = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  width: '100%',
  display: 'grid',
  placeItems: 'center',
  overflowY: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
  },
}));

export const AddLyricsStack = styled(Stack)({
  alignItems: 'center',
  width: '100%',
});

export const AddLyricsTitle = styled(Typography)({
  fontWeight: 700,
});

export interface ActionCardsProps {
  $columns: 2 | 3;
}

export const ActionCards = styled('div', {
  shouldForwardProp: (prop) => prop !== '$columns',
})<ActionCardsProps>(({ theme, $columns }) => ({
  display: 'grid',
  justifyContent: 'center',
  justifyItems: 'center',
  width: '100%',
  gap: theme.spacing(3),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: `repeat(${$columns}, minmax(0, 300px))`,
  },
}));

export const MobileLayout = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const MobileTabs = styled(Tabs)({
  minHeight: 0,
  '& .MuiTabs-indicator': { height: 3 },
});

export const MobileTab = styled(Tab)(({ theme }) => ({
  minHeight: 0,
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(1.5),
}));

export const PaneArea = styled('div')({
  flex: 1,
  minHeight: 0,
});

export const DesktopGrid = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(2),
}));

export const DropOverlay = styled('div')(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: theme.zIndex.modal + 1,
  display: 'grid',
  placeItems: 'center',
  backgroundColor: alpha(theme.palette.background.default, 0.82),
  border: '3px dashed',
  borderColor: theme.palette.primary.main,
  pointerEvents: 'none',
}));

export const OverlayContent = styled(Stack)({
  alignItems: 'center',
});

export const OverlayIcon = styled(UploadFileIcon)({
  fontSize: fontSizes.iconLg,
});

export const OverlayTitle = styled(Typography)({
  fontWeight: 700,
});

export const ManualIcon = styled(EditNoteIcon)({
  fontSize: fontSizes.iconMd,
});

export const SearchCardIcon = styled(SearchIcon)({
  fontSize: fontSizes.iconMd,
});

export const ImportCardIcon = styled(FileOpenIcon)({
  fontSize: fontSizes.iconMd,
});

export const TagsCardIcon = styled(SubtitlesIcon)({
  fontSize: fontSizes.iconMd,
});
