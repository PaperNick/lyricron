import { Typography } from '@mui/material';
import { Root, Step, StepBadge, Steps } from './HowItWorks.styles';

const STEPS = [
  'Upload an MP3',
  'Enter the text you want to annotate',
  'Start the playback',
  'Click Annotate to create timed lyrics',
];

export function HowItWorks() {
  return (
    <Root spacing={8}>
      <Steps>
        {STEPS.map((step, index) => (
          <Step key={step}>
            <StepBadge>{index + 1}</StepBadge>
            <Typography variant="body1" color="text.secondary">
              {step}
            </Typography>
          </Step>
        ))}
      </Steps>
    </Root>
  );
}
