import { useNavigate } from 'react-router-dom';
import { MdCloud, MdSmartToy, MdMovie, MdAdminPanelSettings } from 'react-icons/md';
import { IoMagnet } from "react-icons/io5";
import { Layout } from '../../components/layout/Layout/Layout';
import { AIInput } from '../../components/common/AIInput/AIInput';
import './_Desktop.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getQuoteOfTheDay, getTimeBasedGreeting } from '../../utils/desktop';

export function Desktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quoteToday = getQuoteOfTheDay();

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

  // Add admin app for admin users
  const apps = user?.role === 'admin' 
    ? [...baseApps, {
        id: 'admin',
        name: 'Admin',
        icon: MdAdminPanelSettings,
        path: '/admin',
        color: '#EF4444',
      }]
    : baseApps;

  const handleAppClick = (path: string) => {
    // Check if path is an external URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  const handleMarkovSubmit = (message: string) => {
    const encodedPrompt = encodeURIComponent(message);
    navigate(`/ai?prompt=${encodedPrompt}`);
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
        <div className="desktop__container">
          <div className="desktop__container-header">
            <h3 className="desktop__container-title">{getTimeBasedGreeting()}, {user?.name} !</h3>
            <p className="desktop__container-subtitle">
              {quoteToday?.quote} - <i>{quoteToday?.author}</i>
            </p>
          </div>
          <AIInput
            onSubmit={handleMarkovSubmit}
            placeholder="Ask Markov..."
            showFooter={false}
          />
          <div className="desktop__apps">
            {apps
              .map((app) => {
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
      </div>
    </Layout>
  );
}

