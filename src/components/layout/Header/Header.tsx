import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Search, Grid, List, Cloud, Palette, ChevronDown, LogOut, User, Menu, X } from 'lucide-react';
import { useTheme, type Theme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useFilesStore } from '../../../store/useFilesStore';
import { useNavigate } from 'react-router-dom';
import './_Header.scss';

interface HeaderProps {
  onSearch: (query: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onSearch, viewMode, onViewModeChange, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const resetFilesStore = useFilesStore((state) => state.reset);
  const navigate = useNavigate();

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
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      <div className="header__brand" onClick={() => navigate('/drive')}>
        <Cloud size={24} />
        <span>LivingCloud</span>
      </div>
      <div className="header__search">
        <Search size={20} className="header__search-icon" />
        <input
          type="text"
          className="header__search-input"
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <div className="header__actions">
        <div className="header__view-toggle">
          <button
            className={`header__view-button ${viewMode === 'grid' ? 'header__view-button--active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            className={`header__view-button ${viewMode === 'list' ? 'header__view-button--active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
        <div className="header__theme-picker" ref={themeDropdownRef}>
          <button
            className="header__theme-button"
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            title="Select theme"
          >
            <Palette size={18} />
            <span className="header__theme-name">{themeNames[theme]}</span>
            <ChevronDown size={16} className={`header__theme-chevron ${isThemeDropdownOpen ? 'header__theme-chevron--open' : ''}`} />
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
            <User size={18} />
            <span className="header__user-name">{user.name}</span>
          </div>
        )}
        <button
          className="header__logout-button"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

