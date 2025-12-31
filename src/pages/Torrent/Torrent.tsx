import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { api } from '../../utils/api';
import { MdCloudDownload, MdStop, MdRefresh } from 'react-icons/md';
import './_Torrent.scss';
import type { TorrentDownload } from '../../types/torrent';

export function Torrent() {
  const [magnetLink, setMagnetLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDownloads, setActiveDownloads] = useState<TorrentDownload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active downloads
  const loadActiveDownloads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getActiveDownloads();
      setActiveDownloads(response.data || []);
    } catch (err: any) {
      console.error('Error loading downloads:', err);
      setError(err.message || 'Failed to load active downloads');
    } finally {
      setIsLoading(false);
    }
  };

  // Load downloads on mount and set up polling
  useEffect(() => {
    loadActiveDownloads();
    // Refresh every 5 seconds
    const interval = setInterval(loadActiveDownloads, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!magnetLink.trim()) {
      return;
    }

    // Validate magnet link format
    if (!magnetLink.trim().startsWith('magnet:?')) {
      setError('Please enter a valid magnet link (must start with magnet:?)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.addTorrent(magnetLink.trim());
      console.log('Torrent added successfully. GID:', response.data.gid);
      
      // Clear the input after successful submission
      setMagnetLink('');
      
      // Reload active downloads
      await loadActiveDownloads();
    } catch (err: any) {
      console.error('Error submitting torrent:', err);
      setError(err.message || 'Failed to submit torrent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopDownload = async (gid: string) => {
    try {
      await api.stopDownload(gid);
      console.log('Download stopped. GID:', gid);
      // Reload active downloads
      await loadActiveDownloads();
    } catch (err: any) {
      console.error('Error stopping download:', err);
      setError(err.message || 'Failed to stop download. Please try again.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Auto-paste detection - could be enhanced
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.startsWith('magnet:?')) {
      setMagnetLink(pastedText);
    }
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec?: number): string => {
    if (!bytesPerSec) return '0 B/s';
    return formatBytes(bytesPerSec) + '/s';
  };

  const getProgressPercentage = (download?: TorrentDownload): number => {
    if (!download || !download.totalLength || download.totalLength === 0) return 0;
    const completed = download.completedLength || 0;
    return Math.round((completed / download.totalLength) * 100);
  };

  return (
    <Layout
      onSearch={() => {}}
      viewMode="list"
      onViewModeChange={() => {}}
      showSearch={false}
      showViewToggle={false}
      showSidebar={false}
    >
      <div className="torrent">
        <div className="torrent__container">
          {error && (
            <div className="torrent__error">
              {error}
            </div>
          )}

          <div className="torrent__downloads">
            <div className="torrent__downloads-header">
              <h2 className="torrent__downloads-title">Active Downloads</h2>
              <Button
                variant="ghost"
                onClick={loadActiveDownloads}
                disabled={isLoading}
                className="torrent__refresh-button"
              >
                <MdRefresh size={20} />
                Refresh
              </Button>
            </div>

            {isLoading && activeDownloads.length === 0 ? (
              <div className="torrent__loading">Loading downloads...</div>
            ) : activeDownloads.length === 0 ? (
              <div className="torrent__empty">No active downloads</div>
            ) : (
              <div className="torrent__downloads-list">
                {activeDownloads.map((download) => (
                  <div key={download.gid} className="torrent__download-item">
                    <div className="torrent__download-info">
                      <div className="torrent__download-name">
                        {download.name || download.gid}
                      </div>
                      <div className="torrent__download-details">
                        <span>{getProgressPercentage(download)}%</span>
                        <span>•</span>
                        <span>{formatSpeed(download.downloadSpeed)}</span>
                        <span>•</span>
                        <span>{formatBytes(download.completedLength)} / {formatBytes(download.totalLength)}</span>
                      </div>
                      <div className="torrent__download-progress">
                        <div 
                          className="torrent__download-progress-bar"
                          style={{ width: `${getProgressPercentage(download)}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleStopDownload(download.gid)}
                      className="torrent__stop-button"
                    >
                      <MdStop size={20} />
                      Stop
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form className="torrent__form" onSubmit={handleSubmit}>
            <div className="torrent__input-group">
              <label htmlFor="magnet-link" className="torrent__label">
                Magnet Link
              </label>
              <textarea
                id="magnet-link"
                className="torrent__input"
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                onPaste={handlePaste}
                placeholder="magnet:?xt=urn:btih:..."
                rows={4}
                disabled={isSubmitting}
                required
              />
              <p className="torrent__hint">
                Paste your magnet link here. It should start with "magnet:?"
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!magnetLink.trim() || isSubmitting}
              className="torrent__submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Add Torrent'}
            </Button>
          </form>

        </div>
      </div>
    </Layout>
  );
}

