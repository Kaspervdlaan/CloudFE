import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout/Layout';
import { DownloadList } from '../../components/files/DownloadList/DownloadList';
import { TorrentSearch } from '../../components/files/TorrentSearch/TorrentSearch';
import { api } from '../../utils/api';
import './_Torrent.scss';
import type { TorrentDownload } from '../../types/torrent';
import type { YouTubeJob } from '../../types/youtube';

export function Torrent() {
  const [activeDownloads, setActiveDownloads] = useState<TorrentDownload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeJobs, setYoutubeJobs] = useState<YouTubeJob[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);

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

  const handleAddTorrent = async (magnetLink: string) => {
    try {
      await api.addTorrent(magnetLink);
      await loadActiveDownloads();
      setError(null);
    } catch (err: any) {
      console.error('Error adding torrent:', err);
      setError(err.message || 'Failed to add torrent. Please try again.');
      throw err;
    }
  };

  const handleDownloadYouTube = async (url: string, format: 'mp3' | 'mp4') => {
    try {
      await api.downloadYouTubeVideo(url, format);
      await loadYouTubeJobs();
      setError(null);
    } catch (err: any) {
      console.error('Error downloading from YouTube:', err);
      setError(err.message || 'Failed to download from YouTube. Please try again.');
      throw err;
    }
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
            <div className="torrent__form-section">
              <TorrentSearch
                onAddTorrent={handleAddTorrent}
                onDownloadYouTube={handleDownloadYouTube}
                className="torrent__search-component"
              />
            </div>

            {/* Unified Downloads List */}
            <div className="torrent__downloads-section">
              <DownloadList
                torrentDownloads={activeDownloads}
                youtubeJobs={youtubeJobs}
                isLoadingTorrents={isLoading}
                isLoadingYouTube={isLoadingYouTube}
                onStopTorrent={handleStopDownload}
              />
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

