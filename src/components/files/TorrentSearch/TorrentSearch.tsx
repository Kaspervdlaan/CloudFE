import { useState } from 'react';
import { MdSearch, MdAddCircle, MdStorage, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { api } from '../../../utils/api';
import { Button } from '../../common/Button/Button';
import type { TorrentSearchResult, TorrentCategory } from '../../../types/torrent';
import './_TorrentSearch.scss';

interface TorrentSearchProps {
  onSelectTorrent?: (magnetUri: string) => void;
  onAddTorrent?: (magnetUri: string) => Promise<void>;
  className?: string;
}

const CATEGORIES: { value: TorrentCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'movies', label: 'Movies' },
  { value: 'movies_hd', label: 'Movies HD' },
  { value: 'movies_4k', label: 'Movies 4K' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'tv_hd', label: 'TV Shows HD' },
  { value: 'music', label: 'Music' },
  { value: 'games', label: 'Games' },
  { value: 'software', label: 'Software' },
  { value: 'books', label: 'Books' },
  { value: 'anime', label: 'Anime' },
];

export function TorrentSearch({ 
  onSelectTorrent, 
  onAddTorrent,
  className = '' 
}: TorrentSearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TorrentCategory | ''>('');
  const [results, setResults] = useState<TorrentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [addingTorrent, setAddingTorrent] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTorrents = async (searchQuery: string, searchCategory?: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.searchTorrents(
        searchQuery, 
        searchCategory || undefined, 
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
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchTorrents(query, category);
  };

  const handleAddTorrent = async (magnetUri: string) => {
    if (addingTorrent) return;
    
    setAddingTorrent(magnetUri);
    try {
      if (onAddTorrent) {
        await onAddTorrent(magnetUri);
      } else if (onSelectTorrent) {
        onSelectTorrent(magnetUri);
      } else {
        // Fallback: call API directly
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
            placeholder="Search for torrents..."
            disabled={isSearching}
          />
        </div>
        
        <div className="torrent-search__controls">
          <select
            className="torrent-search__category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as TorrentCategory | '')}
            disabled={isSearching}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          
          <Button
            type="submit"
            variant="primary"
            disabled={!query.trim() || isSearching}
            className="torrent-search__search-button"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

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
                    <span className="torrent-search__meta-item">
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
                      <span className="torrent-search__meta-item">
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

      {!isSearching && hasSearched && results.length === 0 && !error && (
        <div className="torrent-search__empty">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
