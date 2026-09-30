import { formatClock } from '../../lib/time';
import { Duration, Root, Seek, Time } from './ProgressBar.styles';

interface Props {
  currentTime: number;
  duration: number;
  isDecoding: boolean;
  disabled: boolean;
  markers: number[];
  onSeek: (time: number) => void;
}

export function ProgressBar({
  currentTime,
  duration,
  isDecoding,
  disabled,
  markers,
  onSeek,
}: Props) {
  return (
    <Root direction="row" spacing={1.5}>
      <Time variant="caption">{formatClock(currentTime)}</Time>
      <Seek
        value={Math.min(currentTime, duration || 0)}
        max={duration || 1}
        step={0.01}
        disabled={disabled}
        onChange={(_, value) => onSeek(value as number)}
        marks={markers.map((value) => ({ value }))}
        aria-label="Seek"
      />
      <Duration variant="caption">{isDecoding ? 'Decoding…' : formatClock(duration)}</Duration>
    </Root>
  );
}
