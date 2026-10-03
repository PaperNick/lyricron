import { useEffect, useRef, useState } from 'react';
import type { LinePulse } from '../../types';
import { formatLrcTime, parseTimeInput } from '../../lib/time';
import {
  TimestampButton,
  TimestampField,
  TimestampPulse,
  TimestampWrap,
} from './TimestampInput.styles';

interface Props {
  time: number | null;
  onCommit: (time: number) => void;
  onClear: () => void;
  pulse?: LinePulse | null;
}

export function TimestampInput({ time, onCommit, onClear, pulse }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(time === null ? '' : formatLrcTime(time));
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseTimeInput(draft);
    setEditing(false);
    if (parsed !== null) {
      onCommit(parsed);
    } else if (draft.trim() === '') {
      onClear();
    }
  };

  if (editing) {
    return (
      <TimestampField
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <TimestampWrap>
      <TimestampButton
        type="button"
        onClick={startEditing}
        title="Click to edit the timestamp"
        $empty={time === null}
      >
        {time === null ? '--:--.--' : formatLrcTime(time)}
      </TimestampButton>
      {pulse && <TimestampPulse key={pulse.nonce} $direction={pulse.direction} />}
    </TimestampWrap>
  );
}
