import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCloud, MdSmartToy, MdMovie, MdNote, MdPerson} from 'react-icons/md';
import { IoMagnet } from "react-icons/io5";
import { Layout } from '../../components/layout/Layout/Layout';
import './_Desktop.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeBasedGreeting, randomDesktopQuote } from '../../utils/desktop';

export function Desktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote, setQuote] = useState<string | null>(null);
  const isMobile = window.innerWidth < 768;
  const apps = [
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
      id: 'torrent',
      name: 'Torrent',
      icon: IoMagnet,
      path: '/torrent',
      color: '#0000FF',
    },
    {
      id: 'blog',
      name: 'Blog',
      icon: MdNote,
      path: 'https://helpful-frangollo-dde9c8.netlify.app/',
      color: '#8B5CF6',
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: MdPerson,
      path: '/profile',
      color: '#808080',
    }
  ];

  const handleAppClick = (path: string) => {
    // Check if path is an external URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    randomDesktopQuote().then(quote => {
      setQuote(quote);
    });
  }, []);

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
            {quote ? (
              <p className="desktop__container-subtitle">{quote}</p>
            ) : (
              <p className="desktop__container-subtitle">Fetching your daily quote...</p>
            )}
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
      </div>
    </Layout>
  );
}

