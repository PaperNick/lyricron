import { useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { DropArea, DropContent, DropTitle, UploadIcon } from './Dropzone.styles';

interface Props {
  fileName: string | null;
  onFile: (file: File) => void;
}

export function Dropzone({ fileName, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <DropArea
      $dragging={dragging}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.mp4,.webm"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
          event.target.value = '';
        }}
      />
      <DropContent>
        <UploadIcon color="primary" />
        <DropTitle variant="h6">{fileName ?? 'Drop an audio or video file'}</DropTitle>
        <Typography variant="body1" color="text.secondary">
          {fileName
            ? 'Click to choose a different file'
            : 'Drop it anywhere on the page, or click to browse'}
        </Typography>
      </DropContent>
    </DropArea>
  );
}
