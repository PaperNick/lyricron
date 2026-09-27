import { ActionCard } from './ActionCard';
import {
  ActionCards,
  AddLyricsStack,
  AddLyricsTitle,
  ChooseScreen as ChooseScreenRoot,
  ImportCardIcon,
  ManualIcon,
  SearchCardIcon,
} from '../../App.styles';

interface Props {
  onManual: () => void;
  onSearch: () => void;
  onImport: () => void;
}

export function ChooseScreen({ onManual, onSearch, onImport }: Props) {
  return (
    <ChooseScreenRoot>
      <AddLyricsStack spacing={4}>
        <AddLyricsTitle variant="h5">Add lyrics</AddLyricsTitle>
        <ActionCards direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <ActionCard
            icon={<ManualIcon color="primary" />}
            title="Enter Manually"
            description="Type or paste the lyrics yourself, then time each line."
            onClick={onManual}
          />
          <ActionCard
            icon={<SearchCardIcon color="primary" />}
            title="Search on LRCLIB"
            description="Find synced lyrics automatically from the LRCLIB database."
            onClick={onSearch}
          />
          <ActionCard
            icon={<ImportCardIcon color="primary" />}
            title="Import File"
            description="Load lyrics from an .lrc or .txt file."
            onClick={onImport}
          />
        </ActionCards>
      </AddLyricsStack>
    </ChooseScreenRoot>
  );
}
