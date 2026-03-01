import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCloud, MdSmartToy, MdMovie, MdAdminPanelSettings, MdChevronRight, MdChevronLeft } from 'react-icons/md';
import { IoMagnet } from "react-icons/io5";
import { Layout } from '../../components/layout/Layout/Layout';
import { DrawerChat } from '../../components/common/DrawerChat/DrawerChat';
import { TorrentSearch } from '../../components/files/TorrentSearch/TorrentSearch';
import { DownloadList } from '../../components/files/DownloadList/DownloadList';
import { api } from '../../utils/api';
import './_Desktop.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getQuoteOfTheDay, getTimeBasedGreeting } from '../../utils/desktop';
import type { TorrentDownload } from '../../types/torrent';
import type { YouTubeJob } from '../../types/youtube';

export function Desktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quoteToday = getQuoteOfTheDay();

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const DRAWER_MIN_WIDTH = 480;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsDrawerExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeDownloads, setActiveDownloads] = useState<TorrentDownload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeJobs, setYoutubeJobs] = useState<YouTubeJob[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);

  const isMobile = window.innerWidth < 768;
  const baseApps = [
    {
      id: 'drive',
      name: 'Drive',
      icon: MdCloud,
      path: '/drive',
      color: '#4285F4',
    },
    {
      id: 'ai',
      name: 'MarkovAI',
      icon: MdSmartToy,
      path: '/ai',
      color: '#10B981',
    },
    {
      id: 'plex',
      name: 'Plex',
      icon: MdMovie,
      path: 'https://plex.livingcloud.app',
      color: '#F59E0B',
    },
    {
      id: 'download',
      name: 'Download',
      icon: IoMagnet,
      path: '/torrent',
      color: '#0000FF',
    }
  ];

  const apps = user?.role === 'admin' 
    ? [...baseApps, {
        id: 'admin',
        name: 'Admin',
        icon: MdAdminPanelSettings,
        path: '/admin',
        color: '#EF4444',
      }]
    : baseApps;

  // Download polling
  const loadActiveDownloads = async () => {
    setIsLoading(true);
    try {
      const response = await api.getActiveDownloads();
      setActiveDownloads(response.data || []);
    } catch (err: any) {
      console.error('Error loading downloads:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    loadActiveDownloads();
    loadYouTubeJobs();
    const interval = setInterval(() => {
      loadActiveDownloads();
      loadYouTubeJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTorrent = async (magnetLink: string) => {
    await api.addTorrent(magnetLink);
    await loadActiveDownloads();
  };

  const handleDownloadYouTube = async (url: string, format: 'mp3' | 'mp4') => {
    await api.downloadYouTubeVideo(url, format);
    await loadYouTubeJobs();
  };

  const handleStopDownload = async (gid: string) => {
    await api.stopDownload(gid);
    await loadActiveDownloads();
  };

  const handleAppClick = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
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
      <div className="desktop">
        <div className="desktop__main">
          <div className="desktop__downloads">
            <TorrentSearch
              onAddTorrent={handleAddTorrent}
              onDownloadYouTube={handleDownloadYouTube}
            />
            <DownloadList
              torrentDownloads={activeDownloads}
              youtubeJobs={youtubeJobs}
              isLoadingTorrents={isLoading}
              isLoadingYouTube={isLoadingYouTube}
              onStopTorrent={handleStopDownload}
            />
          </div>
          <div className="desktop__apps">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  className="desktop__app"
                  onClick={() => handleAppClick(app.path)}
                  aria-label={`Open ${app.name}`}
                >
                  <div className="desktop__app-icon" style={{ color: app.color }}>
                    <Icon size={isMobile ? 32 : 48} />
                  </div>
                  <span className="desktop__app-name">{app.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={drawerRef}
          className={`desktop__drawer ${isDrawerOpen ? 'desktop__drawer--open' : ''}`}
          style={isDrawerOpen ? { width: isDrawerExpanded ? '40vw' : DRAWER_MIN_WIDTH } : undefined}
          onClick={() => setIsDrawerExpanded(true)}
        >
          <button
            className="desktop__drawer-toggle"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={isDrawerOpen ? 'Close AI drawer' : 'Open AI drawer'}
          >
            {isDrawerOpen ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
          <div className="desktop__drawer-content">
            <div className="desktop__drawer-header">
              <h3 className="desktop__drawer-title">{getTimeBasedGreeting()}, {user?.name}!</h3>
              <p className="desktop__drawer-subtitle">
                {quoteToday?.quote} - <i>{quoteToday?.author}</i>
              </p>
            </div>
            <DrawerChat />
          </div>
        </div>
      </div>
    </Layout>
  );
}

