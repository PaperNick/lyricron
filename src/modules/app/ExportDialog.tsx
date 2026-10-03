import { DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ExportFormat } from '../../types';
import { AppDialog } from './AppDialog';
import { ActionCard } from './ActionCard';
import { Header } from './ConfirmDialog.styles';
import { Cards, LrcIcon, SrtIcon } from './ExportDialog.styles';

interface Props {
  open: boolean;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

export function ExportDialog({ open, onExport, onClose }: Props) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="export-dialog-title"
    >
      <Header id="export-dialog-title">
        Export lyrics
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Header>
      <DialogContent dividers>
        <Cards direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <ActionCard
            icon={<LrcIcon color="primary" />}
            title="LRC"
            description="Timed lyrics with [mm:ss.xx] timestamps."
            onClick={() => onExport('lrc')}
            solidBorder
          />
          <ActionCard
            icon={<SrtIcon color="primary" />}
            title="SRT"
            description="Subtitles with numbered lines and end times."
            onClick={() => onExport('srt')}
            solidBorder
          />
        </Cards>
      </DialogContent>
    </AppDialog>
  );
}
