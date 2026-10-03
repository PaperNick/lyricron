import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import { Card, CardBody } from './ActionCard.styles';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  solidBorder?: boolean;
}

export function ActionCard({ icon, title, description, onClick, solidBorder }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      $solidBorder={solidBorder}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {icon}
      <CardBody>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardBody>
    </Card>
  );
}
