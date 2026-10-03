import { Stack, styled } from '@mui/material';
import LyricsIcon from '@mui/icons-material/Lyrics';
import SubtitlesIcon from '@mui/icons-material/Subtitles';

export const Cards = styled(Stack)(({ theme }) => ({
  alignItems: 'stretch',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    alignItems: 'center',
  },
}));

export const LrcIcon = styled(LyricsIcon)({
  fontSize: '2.25rem',
});

export const SrtIcon = styled(SubtitlesIcon)({
  fontSize: '2.25rem',
});
