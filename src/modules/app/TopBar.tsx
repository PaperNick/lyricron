import { useState } from 'react';
import type { RefObject } from 'react';
import {
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import type { ThemeMode } from '../../theme';
import { TooltipTarget } from '../../components/TooltipTarget';
import {
  Brand,
  BrandIcon,
  BrandRow,
  NavDivider,
  NavSpacer,
  NavToolbar,
  NewButton,
  TopBar as TopBarRoot,
} from '../../App.styles';

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'Theme: System',
  light: 'Theme: Light',
  dark: 'Theme: Dark',
};

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') {
    return <LightModeIcon />;
  }
  if (mode === 'dark') {
    return <DarkModeIcon />;
  }
  return <BrightnessAutoIcon />;
}

interface Props {
  isMobile: boolean;
  themeMode: ThemeMode;
  hasAudio: boolean;
  hasContent: boolean;
  inEditor: boolean;
  hasTimedLines: boolean;
  canUndo: boolean;
  canRedo: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
  onCycleTheme: () => void;
  onExport: () => void;
  onReset: () => void;
  onImportFile: (file: File | undefined) => void;
}

export function TopBar({
  isMobile,
  themeMode,
  hasAudio,
  hasContent,
  inEditor,
  hasTimedLines,
  canUndo,
  canRedo,
  importInputRef,
  onNew,
  onUndo,
  onRedo,
  onShowShortcuts,
  onCycleTheme,
  onExport,
  onReset,
  onImportFile,
}: Props) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const runMenuAction = (action: () => void) => {
    setMenuAnchor(null);
    action();
  };

  return (
    <TopBarRoot position="static" color="inherit" elevation={0}>
      <NavToolbar>
        <BrandRow>
          <BrandIcon />
          <Brand variant="h6" noWrap>
            Lyricron
          </Brand>
        </BrandRow>
        <Tooltip title="Start over with a new MP3">
          <TooltipTarget>
            <NewButton startIcon={<AddIcon />} disabled={!hasAudio && !hasContent} onClick={onNew}>
              New
            </NewButton>
          </TooltipTarget>
        </Tooltip>
        <NavSpacer />

        {isMobile ? (
          <>
            <IconButton
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              aria-label="More actions"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem disabled={!canUndo} onClick={() => runMenuAction(onUndo)}>
                <ListItemIcon>
                  <UndoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Undo</ListItemText>
              </MenuItem>
              <MenuItem disabled={!canRedo} onClick={() => runMenuAction(onRedo)}>
                <ListItemIcon>
                  <RedoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Redo</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => runMenuAction(onShowShortcuts)}>
                <ListItemIcon>
                  <KeyboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Keyboard shortcuts</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => runMenuAction(onCycleTheme)}>
                <ListItemIcon>
                  <ThemeIcon mode={themeMode} />
                </ListItemIcon>
                <ListItemText>{THEME_LABELS[themeMode]}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={!inEditor || !hasTimedLines}
                onClick={() => runMenuAction(onExport)}
              >
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem disabled={!inEditor} onClick={() => runMenuAction(onReset)}>
                <ListItemIcon>
                  <DeleteSweepIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Clear everything</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Tooltip title="Undo (Ctrl+Z)">
              <TooltipTarget>
                <IconButton onClick={onUndo} disabled={!canUndo} aria-label="Undo">
                  <UndoIcon />
                </IconButton>
              </TooltipTarget>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <TooltipTarget>
                <IconButton onClick={onRedo} disabled={!canRedo} aria-label="Redo">
                  <RedoIcon />
                </IconButton>
              </TooltipTarget>
            </Tooltip>
            <NavDivider />
            <Tooltip title="Keyboard shortcuts">
              <IconButton onClick={onShowShortcuts} aria-label="Keyboard shortcuts">
                <KeyboardIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={THEME_LABELS[themeMode]}>
              <IconButton onClick={onCycleTheme} aria-label={THEME_LABELS[themeMode]}>
                <ThemeIcon mode={themeMode} />
              </IconButton>
            </Tooltip>
            <NavDivider />
            <Tooltip title="Export timed lyrics">
              <TooltipTarget>
                <Button
                  startIcon={<FileDownloadIcon />}
                  disabled={!inEditor || !hasTimedLines}
                  onClick={onExport}
                >
                  Export
                </Button>
              </TooltipTarget>
            </Tooltip>
            <Tooltip title="Clear everything">
              <TooltipTarget>
                <Button startIcon={<DeleteSweepIcon />} disabled={!inEditor} onClick={onReset}>
                  Clear
                </Button>
              </TooltipTarget>
            </Tooltip>
          </>
        )}

        <input
          ref={importInputRef}
          type="file"
          accept=".lrc,.txt,.srt,text/plain"
          hidden
          onChange={(event) => {
            onImportFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </NavToolbar>
    </TopBarRoot>
  );
}
