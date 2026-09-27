import { useEffect, useState } from 'react';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { searchLrclib, filenameToQuery } from '../../lib/lrclib';
import type { LrclibResult, LrclibSelection } from '../../lib/lrclib';
import { formatClock } from '../../lib/time';
import {
  Header,
  Loading,
  Pill,
  PillRow,
  ResultBody,
  ResultButton,
  ResultList,
  ResultMeta,
  Results,
  ResultTitle,
  SuggestionChip,
  SuggestionLabel,
  SuggestionRow,
} from './LrclibSearchDialog.styles';
import type { PillTone } from './LrclibSearchDialog.styles';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: LrclibSelection) => void;
  fileName: string | null;
}

const SEARCH_DEBOUNCE_MS = 350;

function kindOf(result: LrclibResult): { label: string; tone: PillTone } {
  if (result.instrumental) {
    return { label: 'Instrumental', tone: 'instrumental' };
  }
  if (result.syncedLyrics) {
    return { label: 'Synced', tone: 'synced' };
  }
  if (result.plainLyrics) {
    return { label: 'Plain', tone: 'plain' };
  }
  return { label: 'No lyrics', tone: 'none' };
}

export function LrclibSearchDialog({ open, onClose, onSelect, fileName }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LrclibResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestion = fileName ? filenameToQuery(fileName) : '';

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const runSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchLrclib(trimmed, controller.signal);
        setResults(data);
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          setError('Could not reach LRCLIB. Check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(() => {
      void runSearch();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  const close = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  const choose = (result: LrclibResult) => {
    onSelect({
      title: result.trackName,
      artist: result.artistName,
      synced: result.syncedLyrics,
      plain: result.plainLyrics,
    });
    close();
  };

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <Header>
        Search lyrics on LRCLIB
        <IconButton onClick={close} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Header>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Song title or artist…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Search LRCLIB' },
            input: {
              endAdornment: query !== '' && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label="Clear search"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setQuery('')}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {suggestion !== '' && suggestion !== trimmed && (
          <SuggestionRow direction="row" spacing={1}>
            <SuggestionLabel variant="caption" color="text.secondary">
              From file name:
            </SuggestionLabel>
            <SuggestionChip
              label={suggestion}
              size="small"
              color="primary"
              variant="outlined"
              icon={<SearchIcon fontSize="small" />}
              onClick={() => setQuery(suggestion)}
            />
          </SuggestionRow>
        )}

        <Results>
          {!hasQuery ? (
            <Typography variant="body2" color="text.secondary">
              Type at least 2 characters to search.
            </Typography>
          ) : loading ? (
            <Loading>
              <CircularProgress size={24} />
            </Loading>
          ) : error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : results.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No results.
            </Typography>
          ) : (
            <ResultList dense>
              {results.map((result) => {
                const kind = kindOf(result);
                return (
                  <ResultButton key={result.id} onClick={() => choose(result)}>
                    <ResultBody>
                      <ResultTitle variant="subtitle2" noWrap>
                        {result.trackName}
                      </ResultTitle>
                      <PillRow direction="row" spacing={0.75}>
                        <Pill $tone="duration">{formatClock(result.duration)}</Pill>
                        <Pill $tone={kind.tone}>{kind.label}</Pill>
                      </PillRow>
                      <ResultMeta variant="body2" color="text.secondary" noWrap>
                        {[result.artistName, result.albumName].filter(Boolean).join(' · ')}
                      </ResultMeta>
                    </ResultBody>
                  </ResultButton>
                );
              })}
            </ResultList>
          )}
        </Results>
      </DialogContent>
    </Dialog>
  );
}
