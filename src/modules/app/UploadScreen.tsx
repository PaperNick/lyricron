import { Typography } from '@mui/material';
import { Dropzone } from '../import/Dropzone';
import { HowItWorks } from './HowItWorks';
import {
  CenterRow,
  DropzoneArea,
  Hero,
  HeroBrand,
  HeroBrandIcon,
  HeroBrandRow,
  HeroDescription,
  PrivacyIcon,
  PrivacyNote,
  Tagline,
  UploadScreen as UploadScreenRoot,
} from '../../App.styles';

interface Props {
  fileName: string | null;
  onFile: (file: File) => void;
}

export function UploadScreen({ fileName, onFile }: Props) {
  return (
    <UploadScreenRoot>
      <Hero>
        <HeroBrandRow>
          <HeroBrandIcon />
          <HeroBrand variant="h4">Lyricron</HeroBrand>
        </HeroBrandRow>
        <Tagline variant="h6">Every line, right on time.</Tagline>
        <HeroDescription variant="body1">
          Create perfectly timed lyrics while you listen. Play a track, tap along, and export a
          ready-to-use LRC file.
        </HeroDescription>
      </Hero>
      <CenterRow>
        <HowItWorks />
      </CenterRow>
      <DropzoneArea>
        <Dropzone fileName={fileName} onFile={onFile} />
        <PrivacyNote>
          <PrivacyIcon />
          <Typography variant="caption">100% private. Works offline.</Typography>
        </PrivacyNote>
      </DropzoneArea>
    </UploadScreenRoot>
  );
}
