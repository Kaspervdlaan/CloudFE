import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { DownloadList } from '../../components/files/DownloadList/DownloadList';
import { api } from '../../utils/api';
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

  const handleRefresh = () => {
    loadActiveDownloads();
    loadYouTubeJobs();
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
            {/* Form Section */}
            <div className="torrent__form-section">
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
            </div>

            {/* Unified Downloads List */}
            <div className="torrent__downloads-section">
              <DownloadList
                torrentDownloads={activeDownloads}
                youtubeJobs={youtubeJobs}
                isLoadingTorrents={isLoading}
                isLoadingYouTube={isLoadingYouTube}
                onRefresh={handleRefresh}
                onStopTorrent={handleStopDownload}
              />
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

