import { useEffect, useMemo, useRef, useState } from 'react';
import type { LyricLine } from '../../types';
import { linesToText } from '../../lib/plain';
import { isLrcText } from '../../lib/lrc';
import { PaneRoot, PaneScrollArea } from './Pane.styles';
import { PaneHeader } from './PaneHeader';
import {
  AccentBar,
  Editor,
  GutterNumber,
  LineRow,
  Mirror,
  MirrorText,
  MirrorWrapper,
} from './PlainLyricsPane.styles';

interface Props {
  lines: LyricLine[];
  hoveredIndex: number | null;
  activeIndex: number;
  onChange: (value: string) => void;
  onCopy: () => void;
  onPasteLrc: (text: string) => void;
}

export function PlainLyricsPane({
  lines,
  hoveredIndex,
  activeIndex,
  onChange,
  onCopy,
  onPasteLrc,
}: Props) {
  const value = useMemo(() => linesToText(lines), [lines]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || hoveredIndex === null) {
      return;
    }
    const row = container.querySelector<HTMLElement>(`[data-line="${hoveredIndex}"]`);
    if (!row) {
      return;
    }
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (top < viewTop) {
      container.scrollTo({ top: Math.max(top - 8, 0), behavior: 'smooth' });
    } else if (bottom > viewBottom) {
      container.scrollTo({ top: bottom - container.clientHeight + 8, behavior: 'smooth' });
    }
  }, [hoveredIndex]);

  return (
    <PaneRoot variant="outlined">
      <PaneHeader
        title="Plain lyrics"
        copyLabel="Copy plain lyrics"
        copyTooltip="Copy plain lyrics"
        copyDisabled={value.trim() === ''}
        onCopy={onCopy}
        inset={0.5}
      />
      <PaneScrollArea ref={scrollRef} data-testid="plain-scroll">
        <MirrorWrapper>
          <Mirror aria-hidden>
            {lines.map((line, index) => {
              const isHovered = index === hoveredIndex;
              const isActive = !isHovered && index === activeIndex;
              return (
                <LineRow
                  key={line.id}
                  data-line={index}
                  $hovered={isHovered}
                  $active={isActive}
                  $focused={focused}
                >
                  {isHovered && <AccentBar />}
                  <GutterNumber $hovered={isHovered}>{index + 1}</GutterNumber>
                  <MirrorText>{line.text}</MirrorText>
                </LineRow>
              );
            })}
          </Mirror>
          <Editor
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onPaste={(event) => {
              const data = event.clipboardData;
              const text = data.getData('text/plain') || data.getData('text');
              if (isLrcText(text)) {
                event.preventDefault();
                onPasteLrc(text);
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            spellCheck={false}
            placeholder="Paste the lyrics here, one line per line…"
          />
        </MirrorWrapper>
      </PaneScrollArea>
    </PaneRoot>
  );
}
