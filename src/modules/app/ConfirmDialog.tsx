import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Header } from './ConfirmDialog.styles';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Discard',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <Header id="confirm-dialog-title">
        {title}
        <IconButton onClick={onCancel} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Header>
      <DialogContent dividers>
        <DialogContentText id="confirm-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
