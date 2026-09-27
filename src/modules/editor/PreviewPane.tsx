import { useEffect, useMemo, useRef } from 'react';
import { Typography } from '@mui/material';
import type { LyricLine } from '../../types';
import { Empty, Line, Pane } from './PreviewPane.styles';

interface Props {
  lines: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export function PreviewPane({ lines, currentTime, onSeek }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    let index = -1;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const time = lines[lineIndex].time;
      if (time !== null && time <= currentTime) {
        index = lineIndex;
      }
    }
    return index;
  }, [lines, currentTime]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeIndex < 0) {
      return;
    }
    const element = container.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!element) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const lineRect = element.getBoundingClientRect();
    const delta =
      lineRect.top + lineRect.height / 2 - (containerRect.top + containerRect.height / 2);
    if (Math.abs(delta) > 2) {
      container.scrollTo({ top: Math.max(container.scrollTop + delta, 0), behavior: 'smooth' });
    }
  }, [activeIndex]);

  if (lines.length === 0) {
    return (
      <Empty>
        <Typography variant="body2" color="text.secondary">
          No timed lines yet. Play the song and tap Annotate to add timestamps.
        </Typography>
      </Empty>
    );
  }

  return (
    <Pane ref={containerRef} data-testid="preview-pane">
      {lines.map((line, index) => {
        const isBlank = line.text.trim() === '';
        return (
          <Line
            key={line.id}
            data-index={index}
            $active={index === activeIndex}
            onClick={() => line.time !== null && onSeek(line.time)}
          >
            {isBlank ? '\u00A0' : line.text}
          </Line>
        );
      })}
    </Pane>
  );
}
