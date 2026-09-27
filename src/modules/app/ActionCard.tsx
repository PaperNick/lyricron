import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import { Card } from './ActionCard.styles';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export function ActionCard({ icon, title, description, onClick }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {icon}
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Card>
  );
}
