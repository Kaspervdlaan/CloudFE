import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { api } from '../../utils/api';
import { MdStop, MdRefresh } from 'react-icons/md';
import './_Torrent.scss';
import type { TorrentDownload } from '../../types/torrent';
import type { YouTubeJob } from '../../types/youtube';

export function Torrent() {
  const [inputUrl, setInputUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDownloads, setActiveDownloads] = useState<TorrentDownload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube download state
  const [youtubeFormat, setYoutubeFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [youtubeJobs, setYoutubeJobs] = useState<YouTubeJob[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const [inputType, setInputType] = useState<'magnet' | 'youtube' | null>(null);

  // Detect input type
  const detectInputType = (url: string): 'magnet' | 'youtube' | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    
    if (trimmed.startsWith('magnet:?')) {
      return 'magnet';
    }
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (youtubeRegex.test(trimmed)) {
      return 'youtube';
    }
    
    return null;
  };

  // Update input type when URL changes
  useEffect(() => {
    const type = detectInputType(inputUrl);
    setInputType(type);
  }, [inputUrl]);

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

  // Load YouTube jobs
  const loadYouTubeJobs = async () => {
    setIsLoadingYouTube(true);
    try {
      const response = await api.listYouTubeJobs();
      setYoutubeJobs(response.data || []);
    } catch (err: any) {
      console.error('Error loading YouTube jobs:', err);
    } finally {
      setIsLoadingYouTube(false);
    }
  };

  // Load downloads on mount and set up polling
  useEffect(() => {
    loadActiveDownloads();
    loadYouTubeJobs();
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadActiveDownloads();
      loadYouTubeJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputUrl.trim()) {
      return;
    }

    const trimmedUrl = inputUrl.trim();
    const detectedType = detectInputType(trimmedUrl);

    if (!detectedType) {
      setError('Please enter a valid magnet link or YouTube URL');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (detectedType === 'magnet') {
        const response = await api.addTorrent(trimmedUrl);
        console.log('Torrent added successfully. GID:', response.data.gid);
        await loadActiveDownloads();
      } else if (detectedType === 'youtube') {
        const response = await api.downloadYouTubeVideo(trimmedUrl, youtubeFormat);
        console.log('YouTube download started. Job ID:', response.data.jobId);
        await loadYouTubeJobs();
      }
      
      // Clear the input after successful submission
      setInputUrl('');
    } catch (err: any) {
      console.error('Error submitting download:', err);
      setError(err.message || 'Failed to submit download. Please try again.');
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
    // Auto-paste detection
    const pastedText = e.clipboardData.getData('text');
    setInputUrl(pastedText);
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

          <div className="torrent__sections">
            {/* Torrent Section */}
            <div className="torrent__section">
              <form className="torrent__form" onSubmit={handleSubmit}>
                <h3 className="torrent__form-title">Add Download</h3>
                <div className="torrent__input-group">
                  <label htmlFor="download-url" className="torrent__label">
                    Magnet Link or YouTube URL
                  </label>
                  <textarea
                    id="download-url"
                    className="torrent__input"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="magnet:?xt=urn:btih:... or https://www.youtube.com/watch?v=..."
                    rows={3}
                    disabled={isSubmitting}
                    required
                  />
                  {inputType === 'youtube' && (
                    <div className="torrent__format-selector">
                      <label className="torrent__format-label">
                        <input
                          type="radio"
                          value="mp4"
                          checked={youtubeFormat === 'mp4'}
                          onChange={(e) => setYoutubeFormat(e.target.value as 'mp4')}
                          disabled={isSubmitting}
                        />
                        <span>MP4 (Video)</span>
                      </label>
                      <label className="torrent__format-label">
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
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!inputUrl.trim() || isSubmitting}
                  className="torrent__submit-button"
                >
                  {isSubmitting 
                    ? 'Submitting...' 
                    : inputType === 'youtube' 
                      ? 'Download from YouTube' 
                      : 'Add Torrent'}
                </Button>
              </form>

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
            </div>

            {/* YouTube Section */}
            <div className="torrent__section">
              <div className="torrent__downloads">
                <div className="torrent__downloads-header">
                  <h2 className="torrent__downloads-title">YouTube Downloads</h2>
                  <Button
                    variant="ghost"
                    onClick={loadYouTubeJobs}
                    disabled={isLoadingYouTube}
                    className="torrent__refresh-button"
                  >
                    <MdRefresh size={20} />
                    Refresh
                  </Button>
                </div>

                {isLoadingYouTube && youtubeJobs.length === 0 ? (
                  <div className="torrent__loading">Loading YouTube jobs...</div>
                ) : youtubeJobs.length === 0 ? (
                  <div className="torrent__empty">No YouTube downloads</div>
                ) : (
                  <div className="torrent__downloads-list">
                    {youtubeJobs.map((job) => (
                      <div key={job.jobId} className="torrent__download-item">
                        <div className="torrent__download-info">
                          <div className="torrent__download-name">
                            {job.filename || job.url}
                          </div>
                          <div className="torrent__download-details">
                            <span className={`torrent__status torrent__status--${job.status}`}>
                              {job.status}
                            </span>
                            <span>•</span>
                            <span>{job.format.toUpperCase()}</span>
                            {job.progress !== undefined && (
                              <>
                                <span>•</span>
                                <span>{job.progress}%</span>
                              </>
                            )}
                            {job.error && (
                              <>
                                <span>•</span>
                                <span className="torrent__error-text">{job.error}</span>
                              </>
                            )}
                          </div>
                          {job.progress !== undefined && job.progress > 0 && (
                            <div className="torrent__download-progress">
                              <div 
                                className="torrent__download-progress-bar"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

