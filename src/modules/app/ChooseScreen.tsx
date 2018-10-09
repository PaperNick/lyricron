import type { EmbeddedLyricsStatus } from '../../types';
import { ActionCard } from './ActionCard';
import {
  ActionCards,
  AddLyricsStack,
  AddLyricsTitle,
  ChooseScreen as ChooseScreenRoot,
  ImportCardIcon,
  ManualIcon,
  SearchCardIcon,
  TagsCardIcon,
} from '../../App.styles';

interface Props {
  onManual: () => void;
  onSearch: () => void;
  onImport: () => void;
  embeddedLyricsStatus: EmbeddedLyricsStatus;
  onLoadEmbeddedLyrics: () => void;
}

export function ChooseScreen({
  onManual,
  onSearch,
  onImport,
  embeddedLyricsStatus,
  onLoadEmbeddedLyrics,
}: Props) {
  const showTagsCard = embeddedLyricsStatus === 'available';

  return (
    <ChooseScreenRoot>
      <AddLyricsStack spacing={4}>
        <AddLyricsTitle variant="h5">Add lyrics</AddLyricsTitle>
        <ActionCards $columns={showTagsCard ? 2 : 3}>
          {showTagsCard && (
            <ActionCard
              icon={<TagsCardIcon color="primary" />}
              title="Load from MP3"
              description="Use the lyrics already saved inside this file."
              onClick={onLoadEmbeddedLyrics}
              highlighted
            />
          )}
          <ActionCard
            icon={<ImportCardIcon color="primary" />}
            title="Import File"
            description="Load lyrics from an .lrc, .srt or .txt file."
            onClick={onImport}
          />
          <ActionCard
            icon={<SearchCardIcon color="primary" />}
            title="Search on LRCLIB"
            description="Find synced lyrics automatically from the LRCLIB database."
            onClick={onSearch}
          />
          <ActionCard
            icon={<ManualIcon color="primary" />}
            title="Enter Manually"
            description="Type or paste the lyrics yourself, then time each line."
            onClick={onManual}
          />
        </ActionCards>
      </AddLyricsStack>
    </ChooseScreenRoot>
  );
}
