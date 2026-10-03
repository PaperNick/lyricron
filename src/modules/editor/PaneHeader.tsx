import type { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { TooltipTarget } from '../../components/TooltipTarget';
import { CopyButton, CopyIcon, Header, Title } from './Pane.styles';

interface Props {
  title: string;
  copyLabel: string;
  copyTooltip: string;
  copyDisabled: boolean;
  onCopy: () => void;
  inset?: number;
  children?: ReactNode;
}

export function PaneHeader({
  title,
  copyLabel,
  copyTooltip,
  copyDisabled,
  onCopy,
  inset,
  children,
}: Props) {
  return (
    <Header $inset={inset}>
      <Title variant="subtitle1">{title}</Title>
      <Tooltip title={copyTooltip}>
        <TooltipTarget>
          <CopyButton size="small" onClick={onCopy} disabled={copyDisabled} aria-label={copyLabel}>
            <CopyIcon />
          </CopyButton>
        </TooltipTarget>
      </Tooltip>
      {children}
    </Header>
  );
}
