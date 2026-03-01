import { useState, useEffect } from 'react';
import { MdSearch, MdAddCircle, MdStorage, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { api } from '../../../utils/api';
import { Button } from '../../common/Button/Button';
import type { TorrentSearchResult } from '../../../types/torrent';
import './_TorrentSearch.scss';

type InputType = 'magnet' | 'youtube' | 'search';

interface TorrentSearchProps {
  onAddTorrent?: (magnetUri: string) => Promise<void>;
  onDownloadYouTube?: (url: string, format: 'mp3' | 'mp4') => Promise<void>;
  className?: string;
}

const detectInputType = (value: string): InputType => {
  const trimmed = value.trim();
  if (trimmed.startsWith('magnet:?')) return 'magnet';
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(trimmed)) return 'youtube';
  return 'search';
};

export function TorrentSearch({ 
  onAddTorrent,
  onDownloadYouTube,
  className = '' 
}: TorrentSearchProps) {
  const [query, setQuery] = useState('');
  const [inputType, setInputType] = useState<InputType>('search');
  const [youtubeFormat, setYoutubeFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [results, setResults] = useState<TorrentSearchResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [addingTorrent, setAddingTorrent] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setInputType(detectInputType(query));
  }, [query]);

  const searchTorrents = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.searchTorrents(
        searchQuery, 
        undefined, 
        50
      );
      const data = response.data;
      
      setResults(data.results || []);
      setResultCount(data.count || 0);
    } catch (err: any) {
      console.error('Error searching torrents:', err);
      setError(err.message || 'Failed to search torrents. Please try again.');
      setResults([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (inputType === 'magnet') {
      setIsSubmitting(true);
      setError(null);
      try {
        if (onAddTorrent) await onAddTorrent(trimmed);
        setQuery('');
      } catch (err: any) {
        setError(err.message || 'Failed to add torrent.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (inputType === 'youtube') {
      setIsSubmitting(true);
      setError(null);
      try {
        if (onDownloadYouTube) await onDownloadYouTube(trimmed, youtubeFormat);
        setQuery('');
      } catch (err: any) {
        setError(err.message || 'Failed to download from YouTube.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await searchTorrents(trimmed);
    }
  };

  const handleAddTorrent = async (magnetUri: string) => {
    if (addingTorrent) return;
    
    setAddingTorrent(magnetUri);
    try {
      if (onAddTorrent) {
        await onAddTorrent(magnetUri);
      } else {
        await api.addTorrent(magnetUri);
      }
    } catch (err: any) {
      console.error('Error adding torrent:', err);
      setError(err.message || 'Failed to add torrent. Please try again.');
    } finally {
      setAddingTorrent(null);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const buttonLabel = isSubmitting
    ? 'Submitting...'
    : inputType === 'magnet'
      ? 'Add Torrent'
      : inputType === 'youtube'
        ? 'Download'
        : 'Search';

  return (
    <div className={`torrent-search ${className}`}>
      <form className="torrent-search__form" onSubmit={handleSubmit}>
        <div className="torrent-search__input-wrapper">
          <MdSearch className="torrent-search__search-icon" />
          <input
            type="text"
            className="torrent-search__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search torrents, paste magnet link, or YouTube URL..."
            disabled={isSubmitting}
          />
        </div>
        
        <div className="torrent-search__controls">
          <Button
            type="submit"
            variant="primary"
            disabled={!query.trim() || isSubmitting}
            className="torrent-search__search-button"
          >
            {buttonLabel}
          </Button>
        </div>
      </form>

      {inputType === 'youtube' && (
        <div className="torrent-search__format-selector">
          <label className="torrent-search__format-label">
            <input
              type="radio"
              value="mp4"
              checked={youtubeFormat === 'mp4'}
              onChange={(e) => setYoutubeFormat(e.target.value as 'mp4')}
              disabled={isSubmitting}
            />
            <span>MP4 (Video)</span>
          </label>
          <label className="torrent-search__format-label">
            <input
              type="radio"
              value="mp3"
              checked={youtubeFormat === 'mp3'}
              onChange={(e) => setYoutubeFormat(e.target.value as 'mp3')}
              disabled={isSubmitting}
            />
            <span>MP3 (Audio)</span>
          </label>
        </div>
      )}

      {error && (
        <div className="torrent-search__error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="torrent-search__results">
          <div className="torrent-search__results-header">
            <span className="torrent-search__results-count">
              Found {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="torrent-search__results-list">
            {results.map((torrent, index) => (
              <div key={index} className="torrent-search__result-item">
                <div className="torrent-search__result-content">
                  <h4 className="torrent-search__result-name">{torrent.title}</h4>
                  
                  <div className="torrent-search__result-meta">
                    <span className="torrent-search__meta-item torrent-search__meta-item--size">
                      <MdStorage size={12} />
                      {torrent.sizeFormatted}
                    </span>
                    <span className="torrent-search__meta-item torrent-search__seeders">
                      <MdArrowUpward size={12} />
                      {torrent.seeders}
                    </span>
                    <span className="torrent-search__meta-item torrent-search__leechers">
                      <MdArrowDownward size={12} />
                      {torrent.leechers}
                    </span>
                    <span className="torrent-search__meta-item torrent-search__tracker">
                      {torrent.tracker}
                    </span>
                    {torrent.publishDate && (
                      <span className="torrent-search__meta-item torrent-search__meta-item--date">
                        {formatDate(torrent.publishDate)}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  onClick={() => handleAddTorrent(torrent.magnetUri)}
                  disabled={addingTorrent === torrent.magnetUri}
                  className="torrent-search__add-button"
                >
                  <MdAddCircle size={16} />
                  {addingTorrent === torrent.magnetUri ? 'Adding...' : 'Add'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSubmitting && hasSearched && results.length === 0 && !error && (
        <div className="torrent-search__empty">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
