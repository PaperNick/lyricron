import { useId } from 'react';
import { brandGradient } from '../../theme/colors';

interface Props {
  className?: string;
}

/** The Lyricron mark: a waveform pulse that resolves into a tall cursor. */
export function BrandMark({ className }: Props) {
  const gradientId = useId();

  return (
    <svg viewBox="1 3 32 40" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id={gradientId}
          x1="4"
          y1="6"
          x2="34"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={brandGradient.from} />
          <stop offset="1" stopColor={brandGradient.to} />
        </linearGradient>
      </defs>
      <path
        d="M4 24 L11 24 L15 13 L20 33 L25 19 L30 24 L30 6 L30 40"
        stroke={`url(#${gradientId})`}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
