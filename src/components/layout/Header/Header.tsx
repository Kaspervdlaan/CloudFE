import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { MdSearch, MdGridOn, MdList, MdPalette, MdExpandMore, MdLogout, MdPerson, MdMenu, MdClose, MdCloud, MdSmartToy } from 'react-icons/md';
import { Cloud } from 'lucide-react';
import { useTheme, type Theme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useFilesStore } from '../../../store/useFilesStore';
import { useNavigate, useLocation } from 'react-router-dom';
import './_Header.scss';

interface HeaderProps {
  onSearch: (query: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
}

export function Header({ onSearch, viewMode, onViewModeChange, onToggleSidebar, isSidebarOpen, showSearch = true, showViewToggle = true }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const resetFilesStore = useFilesStore((state) => state.reset);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };

    if (isThemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeDropdownOpen]);

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsThemeDropdownOpen(false);
  };

  const handleLogout = () => {
    resetFilesStore(); // Clear files store before logout
    logout();
    navigate('/');
  };

  const themeNames: Record<Theme, string> = {
    hacker: 'Hacker Terminal',
    minimal: 'Minimal & Slick',
    dark: 'Dark Mode',
    ocean: 'Ocean Breeze',
    sunset: 'Sunset Warmth',
    forest: 'Forest Green',
    deepForest: 'Deep Forest',
  };

  return (
    <header className="header">
      {onToggleSidebar && (
        <button
          className="header__menu-button"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
        </button>
      )}
      <div className="header__brand" onClick={() => navigate('/drive')}>
        <Cloud size={24} />
        <span>Living Cloud</span>
      </div>
      <div className="header__navigation">
        <button
          className={`header__nav-button ${location.pathname === '/drive' ? 'header__nav-button--active' : ''}`}
          onClick={() => navigate('/drive')}
          title="Drive"
        >
          <Cloud size={18} />
          <span>Drive</span>
        </button>
        <button
          className={`header__nav-button ${location.pathname === '/ai' ? 'header__nav-button--active' : ''}`}
          onClick={() => navigate('/ai')}
          title="AI Chat"
        >
          <MdSmartToy size={18} />
          <span>AI Chat</span>
        </button>
      </div>
      {showSearch && (
        <div className="header__search">
          <MdSearch size={20} className="header__search-icon" />
          <input
            type="text"
            className="header__search-input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}
      <div className="header__actions">
        {showViewToggle && (
          <div className="header__view-toggle">
            <button
              className={`header__view-button ${viewMode === 'grid' ? 'header__view-button--active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid view"
            >
              <MdGridOn size={18} />
            </button>
            <button
              className={`header__view-button ${viewMode === 'list' ? 'header__view-button--active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List view"
            >
              <MdList size={18} />
            </button>
          </div>
        )}
        <div className="header__theme-picker" ref={themeDropdownRef}>
          <button
            className="header__theme-button"
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            title="Select theme"
          >
            <MdPalette size={18} />
            <span className="header__theme-name">{themeNames[theme]}</span>
            <MdExpandMore size={16} className={`header__theme-chevron ${isThemeDropdownOpen ? 'header__theme-chevron--open' : ''}`} />
          </button>
          {isThemeDropdownOpen && (
            <div className="header__theme-dropdown">
              {(Object.keys(themeNames) as Theme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  className={`header__theme-option ${theme === themeKey ? 'header__theme-option--active' : ''}`}
                  onClick={() => handleThemeSelect(themeKey)}
                >
                  {themeNames[themeKey]}
                  {theme === themeKey && <span className="header__theme-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {user && (
          <div className="header__user">
            <MdPerson size={18} />
            <span className="header__user-name">{user.name}</span>
          </div>
        )}
        <button
          className="header__logout-button"
          onClick={handleLogout}
          title="Logout"
        >
          <MdLogout size={18} />
        </button>
      </div>
    </header>
  );
}

