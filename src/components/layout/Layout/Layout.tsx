import { useState, useEffect, type ReactNode } from 'react';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import './_Layout.scss';

interface LayoutProps {
  children: ReactNode;
  onSearch: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showSidebar?: boolean;
}

export function Layout({
  children,
  onSearch,
  viewMode,
  onViewModeChange,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
  showSearch = true,
  showViewToggle = true,
  showSidebar = true,
}: LayoutProps) {
  // Start with sidebar closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // $breakpoint-md
    }
    return true;
  });

  // Update sidebar state when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // On desktop, keep sidebar open
        setIsSidebarOpen(true);
      } else {
        // On mobile, close sidebar
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Header
        onSearch={onSearch}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onToggleSidebar={showSidebar ? toggleSidebar : undefined}
        isSidebarOpen={isSidebarOpen}
        showSearch={showSearch}
        showViewToggle={showViewToggle}
      />
      <div className="layout__body">
        {showSidebar && isSidebarOpen && <div className="layout__overlay" onClick={closeSidebar} />}
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onFileDrop={onFileDrop}
            onDropFiles={onDropFiles}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            dragOverFolderId={dragOverFolderId}
          />
        )}
        <main className={`layout__main ${!showSidebar ? 'layout__main--no-sidebar' : ''}`}>{children}</main>
      </div>
    </div>
  );
}

