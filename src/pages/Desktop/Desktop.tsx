import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCloud, MdSmartToy, MdMovie, MdNote, MdEvent, MdHeadphones, MdSettings, MdPerson } from 'react-icons/md';
import { Layout } from '../../components/layout/Layout/Layout';
import './_Desktop.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeBasedGreeting, randomDesktopQuote } from '../../utils/desktop';

export function Desktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote, setQuote] = useState<string | null>(null);
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
      name: 'Markov',
      icon: MdSmartToy,
      path: '/ai',
      color: '#10B981',
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: MdEvent,
      path: '/calendar',
      color: '#F59E0B',
    },
    {
      id: 'plex',
      name: 'Plex',
      icon: MdMovie,
      path: 'https://plex.livingcloud.app',
      color: '#F59E0B',
    },
    {
      id: 'music',
      name: 'Music',
      icon: MdHeadphones,
      path: '/music',
      color: '#F59E0B',
    },
    {
      id: 'blog',
      name: 'Blog',
      icon: MdNote,
      path: '/blog',
      color: '#F59E0B',
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: MdPerson,
      path: '/profile',
      color: '#F59E0B',
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: MdSettings,
      path: '/settings',
      color: '#F59E0B',
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
                    <Icon size={32} />
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

