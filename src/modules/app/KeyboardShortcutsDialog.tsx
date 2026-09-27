import { Dialog, DialogContent, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SHORTCUTS, shortcutLabel } from '../../config/shortcuts';
import { Description, Header, Key, Row } from './KeyboardShortcutsDialog.styles';

interface Props {
  open: boolean;
  onClose: () => void;
}

const playPause = shortcutLabel(SHORTCUTS.playPause);
const annotate = shortcutLabel(SHORTCUTS.annotate);
const undo = shortcutLabel(SHORTCUTS.undo);
const shift = `${shortcutLabel(SHORTCUTS.shiftEarlier)} / ${shortcutLabel(SHORTCUTS.shiftLater)}`;
const seek = `${shortcutLabel(SHORTCUTS.seekBack)} / ${shortcutLabel(SHORTCUTS.seekForward)}`;
const seekLine = `Ctrl/⌘ + ${shortcutLabel(SHORTCUTS.seekBack)} / ${shortcutLabel(SHORTCUTS.seekForward)}`;
const help = '?';

const SHORTCUTS_LIST: [string, string][] = [
  [playPause, 'Play / Pause'],
  [annotate, 'Annotate the next line'],
  [seek, 'Seek −5 s / +5 s'],
  [`Shift + ${seek}`, 'Seek −1 s / +1 s'],
  [seekLine, 'Previous / next timed line'],
  [undo, 'Undo'],
  ['Ctrl/⌘ + Z', 'Undo'],
  ['Ctrl/⌘ + Shift + Z', 'Redo'],
  ['Ctrl/⌘ + Y', 'Redo'],
  [shift, 'Shift the last line −50 ms / +50 ms'],
  [help, 'Show this help'],
];

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Header>
        Keyboard shortcuts
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Header>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {SHORTCUTS_LIST.map(([keys, description]) => (
            <Row key={keys} direction="row" spacing={2}>
              <Key>{keys}</Key>
              <Description variant="body2" color="text.secondary">
                {description}
              </Description>
            </Row>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
