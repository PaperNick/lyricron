import { useState } from 'react';
import { Button, Collapse, Divider, IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TuneIcon from '@mui/icons-material/Tune';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { ProgressBar } from './ProgressBar';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SHORTCUTS, shortcutLabel } from '../../config/shortcuts';
import { TooltipTarget } from '../../components/TooltipTarget';
import {
  AnnotateButton,
  AnnotateGrow,
  BannerSeparator,
  BarRoot,
  ControlGroup,
  DesktopBody,
  GroupLabel,
  MobileAnnotateButton,
  MobileBody,
  MobileOptions,
  MobilePlayButton,
  MobileTransportRow,
  MoreButton,
  NextBanner,
  NextLabel,
  NextText,
  PlayButton,
  ProgressWrapper,
  RateValue,
  Spacer,
  StepButton,
  TransportRow,
  UtilsRow,
} from './TransportBar.styles';

const MIN_RATE = 0.5;
const MAX_RATE = 2;
const RATE_STEP = 0.05;

const PLAY_KEY = shortcutLabel(SHORTCUTS.playPause);
const ANNOTATE_KEY = shortcutLabel(SHORTCUTS.annotate);
const PREV_KEY = shortcutLabel(SHORTCUTS.seekBack);
const NEXT_KEY = shortcutLabel(SHORTCUTS.seekForward);

function changeRate(rate: number, delta: number): number {
  const next = Math.round((rate + delta) * 100) / 100;
  return Math.min(Math.max(next, MIN_RATE), MAX_RATE);
}

interface Props {
  isPlaying: boolean;
  disabled: boolean;
  canAnnotate: boolean;
  annotateHint: string;
  nextLineText: string | null;
  currentTime: number;
  duration: number;
  isDecoding: boolean;
  markers: number[];
  playbackRate: number;
  onToggle: () => void;
  onAnnotate: () => void;
  onSeek: (time: number) => void;
  onRateChange: (rate: number) => void;
  onShiftAll: (delta: number) => void;
  onPrevLine: () => void;
  onNextLine: () => void;
}

export function TransportBar({
  isPlaying,
  disabled,
  canAnnotate,
  annotateHint,
  nextLineText,
  currentTime,
  duration,
  isDecoding,
  markers,
  playbackRate,
  onToggle,
  onAnnotate,
  onSeek,
  onRateChange,
  onShiftAll,
  onPrevLine,
  onNextLine,
}: Props) {
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);
  const allAnnotated = nextLineText === null;
  const isBlankLine = nextLineText === 'Blank line';

  const nextBanner = (
    <NextBanner data-testid="next-line-banner" $done={allAnnotated}>
      <NextLabel variant="overline" $done={allAnnotated}>
        {allAnnotated ? 'Done' : 'Next'}
      </NextLabel>
      <BannerSeparator />
      <NextText variant="body1" noWrap $blank={isBlankLine} $done={allAnnotated}>
        {nextLineText ?? 'All lines are annotated'}
      </NextText>
    </NextBanner>
  );

  const speedControls = (
    <ControlGroup direction="row">
      <GroupLabel variant="caption">Speed</GroupLabel>
      <Tooltip title="Slower (5% steps)">
        <TooltipTarget>
          <IconButton
            size="small"
            disabled={disabled || playbackRate <= MIN_RATE}
            onClick={() => onRateChange(changeRate(playbackRate, -RATE_STEP))}
            aria-label="Decrease speed"
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </TooltipTarget>
      </Tooltip>
      <RateValue variant="body2">{Math.round(playbackRate * 100)}%</RateValue>
      <Tooltip title="Faster (5% steps)">
        <TooltipTarget>
          <IconButton
            size="small"
            disabled={disabled || playbackRate >= MAX_RATE}
            onClick={() => onRateChange(changeRate(playbackRate, RATE_STEP))}
            aria-label="Increase speed"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </TooltipTarget>
      </Tooltip>
    </ControlGroup>
  );

  const shiftControls = (
    <ControlGroup direction="row">
      <GroupLabel variant="caption">Shift all</GroupLabel>
      <Tooltip title="Shift every timestamp 50 ms earlier">
        <TooltipTarget>
          <Button
            size="small"
            startIcon={<RemoveIcon />}
            disabled={disabled}
            onClick={() => onShiftAll(-0.05)}
          >
            50ms
          </Button>
        </TooltipTarget>
      </Tooltip>
      <Tooltip title="Shift every timestamp 50 ms later">
        <TooltipTarget>
          <Button
            size="small"
            startIcon={<AddIcon />}
            disabled={disabled}
            onClick={() => onShiftAll(0.05)}
          >
            50ms
          </Button>
        </TooltipTarget>
      </Tooltip>
    </ControlGroup>
  );

  if (isMobile) {
    return (
      <BarRoot variant="outlined">
        {nextBanner}
        <MobileBody>
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            isDecoding={isDecoding}
            disabled={disabled}
            markers={markers}
            onSeek={onSeek}
          />

          <MobileTransportRow direction="row">
            <Tooltip title={`Previous timed line (Ctrl/⌘ + ${PREV_KEY})`}>
              <TooltipTarget>
                <IconButton onClick={onPrevLine} disabled={disabled} aria-label="Previous line">
                  <SkipPreviousIcon />
                </IconButton>
              </TooltipTarget>
            </Tooltip>
            <Tooltip title={`Play / Pause (${PLAY_KEY})`}>
              <TooltipTarget>
                <MobilePlayButton
                  onClick={onToggle}
                  disabled={disabled}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </MobilePlayButton>
              </TooltipTarget>
            </Tooltip>
            <Tooltip title={`Next timed line (Ctrl/⌘ + ${NEXT_KEY})`}>
              <TooltipTarget>
                <IconButton onClick={onNextLine} disabled={disabled} aria-label="Next line">
                  <SkipNextIcon />
                </IconButton>
              </TooltipTarget>
            </Tooltip>
            <Tooltip
              title={canAnnotate ? `Annotate the next line (${ANNOTATE_KEY})` : annotateHint}
            >
              <AnnotateGrow>
                <MobileAnnotateButton
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!canAnnotate}
                  onClick={onAnnotate}
                >
                  Annotate
                </MobileAnnotateButton>
              </AnnotateGrow>
            </Tooltip>
          </MobileTransportRow>

          <MoreButton
            size="small"
            startIcon={<TuneIcon />}
            onClick={() => setShowMore((value) => !value)}
          >
            {showMore ? 'Less' : 'More'}
          </MoreButton>
          <Collapse in={showMore}>
            <MobileOptions>
              {speedControls}
              {shiftControls}
            </MobileOptions>
          </Collapse>
        </MobileBody>
      </BarRoot>
    );
  }

  return (
    <BarRoot variant="outlined">
      {nextBanner}
      <DesktopBody>
        <TransportRow direction="row">
          <Tooltip title={`Previous timed line (Ctrl/⌘ + ${PREV_KEY})`}>
            <TooltipTarget>
              <StepButton onClick={onPrevLine} disabled={disabled} aria-label="Previous line">
                <SkipPreviousIcon />
              </StepButton>
            </TooltipTarget>
          </Tooltip>
          <Tooltip title={`Play / Pause (${PLAY_KEY})`}>
            <TooltipTarget>
              <PlayButton
                variant="contained"
                size="large"
                disabled={disabled}
                onClick={onToggle}
                startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </PlayButton>
            </TooltipTarget>
          </Tooltip>
          <Tooltip title={`Next timed line (Ctrl/⌘ + ${NEXT_KEY})`}>
            <TooltipTarget>
              <StepButton onClick={onNextLine} disabled={disabled} aria-label="Next line">
                <SkipNextIcon />
              </StepButton>
            </TooltipTarget>
          </Tooltip>
          <Spacer />
          <Tooltip title={canAnnotate ? `Annotate the next line (${ANNOTATE_KEY})` : annotateHint}>
            <TooltipTarget>
              <AnnotateButton
                variant="outlined"
                size="large"
                disabled={!canAnnotate}
                onClick={onAnnotate}
              >
                Annotate
              </AnnotateButton>
            </TooltipTarget>
          </Tooltip>
        </TransportRow>

        <ProgressWrapper>
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            isDecoding={isDecoding}
            disabled={disabled}
            markers={markers}
            onSeek={onSeek}
          />
        </ProgressWrapper>

        <UtilsRow direction="row" divider={<Divider orientation="vertical" flexItem />}>
          {speedControls}
          {shiftControls}
        </UtilsRow>
      </DesktopBody>
    </BarRoot>
  );
}
