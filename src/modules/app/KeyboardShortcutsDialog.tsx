import { DialogContent, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AppDialog } from './AppDialog';
import { SHORTCUTS, shortcutLabel } from '../../config/shortcuts';
import { Description, GroupTitle, Header, Key, Row } from './KeyboardShortcutsDialog.styles';

interface Props {
  open: boolean;
  onClose: () => void;
}

const playPause = shortcutLabel(SHORTCUTS.playPause);
const annotate = shortcutLabel(SHORTCUTS.annotate);
const undo = shortcutLabel(SHORTCUTS.undo);
const shiftEarlier = shortcutLabel(SHORTCUTS.shiftEarlier);
const shiftLater = shortcutLabel(SHORTCUTS.shiftLater);
const deleteKey = shortcutLabel(SHORTCUTS.delete);
const deleteActive = `Ctrl/⌘ + ${shortcutLabel(SHORTCUTS.delete)}`;
const setActive = `Ctrl/⌘ + ${shortcutLabel(SHORTCUTS.annotate)}`;
const seekBack = shortcutLabel(SHORTCUTS.seekBack);
const seekForward = shortcutLabel(SHORTCUTS.seekForward);
const help = '?';

interface ShortcutGroup {
  title: string;
  shortcuts: [string, string][];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Playback',
    shortcuts: [
      [playPause, 'Play / Pause'],
      [seekBack, 'Seek -5 s'],
      [seekForward, 'Seek +5 s'],
      [`Shift + ${seekBack}`, 'Seek -1 s'],
      [`Shift + ${seekForward}`, 'Seek +1 s'],
      [`Ctrl/⌘ + ${seekBack}`, 'Previous timed line'],
      [`Ctrl/⌘ + ${seekForward}`, 'Next timed line'],
    ],
  },
  {
    title: 'Annotate',
    shortcuts: [
      [annotate, 'Annotate the next line'],
      [setActive, 'Set the highlighted line to the current time'],
    ],
  },
  {
    title: 'Timestamps',
    shortcuts: [
      [shiftEarlier, 'Shift the last line -50 ms'],
      [shiftLater, 'Shift the last line +50 ms'],
      [`Ctrl/⌘ + ${shiftEarlier}`, 'Shift the highlighted line -50 ms'],
      [`Ctrl/⌘ + ${shiftLater}`, 'Shift the highlighted line +50 ms'],
      [deleteKey, 'Delete the last timestamp'],
      [deleteActive, "Delete the highlighted line's timestamp"],
    ],
  },
  {
    title: 'History',
    shortcuts: [
      [undo, 'Undo'],
      ['Ctrl/⌘ + Z', 'Undo'],
      ['Ctrl/⌘ + Shift + Z', 'Redo'],
      ['Ctrl/⌘ + Y', 'Redo'],
    ],
  },
  {
    title: 'Help',
    shortcuts: [[help, 'Show this help']],
  },
];

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxHeight: { xs: '72vh' } } }}
    >
      <Header>
        Keyboard shortcuts
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Header>
      <DialogContent dividers>
        <Stack spacing={3}>
          {SHORTCUT_GROUPS.map((group) => (
            <Stack key={group.title} spacing={1.5}>
              <GroupTitle variant="overline">{group.title}</GroupTitle>
              {group.shortcuts.map(([keys, description]) => (
                <Row key={`${group.title}-${keys}`} direction="row" spacing={2}>
                  <Key>{keys}</Key>
                  <Description variant="body2" color="text.secondary">
                    {description}
                  </Description>
                </Row>
              ))}
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </AppDialog>
  );
}
