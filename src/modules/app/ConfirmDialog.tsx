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
  secondaryLabel?: string;
  onConfirm: () => void;
  onSecondary?: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Discard',
  secondaryLabel,
  onConfirm,
  onSecondary,
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
        <Button
          onClick={onConfirm}
          color={secondaryLabel ? 'primary' : 'error'}
          variant={secondaryLabel ? 'outlined' : 'text'}
          autoFocus={!secondaryLabel}
        >
          {confirmLabel}
        </Button>
        {secondaryLabel ? (
          <Button onClick={onSecondary} color="primary" variant="contained" autoFocus>
            {secondaryLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
