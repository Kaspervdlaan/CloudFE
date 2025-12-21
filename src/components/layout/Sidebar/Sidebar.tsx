import { FolderTree } from '../../files/FolderTree/FolderTree';
import { useFilesStore } from '../../../store/useFilesStore';
import { useAuth } from '../../../contexts/AuthContext';
import type { User } from '../../../types/auth';
import { IoFolder, IoFolderOpen } from 'react-icons/io5';
import './_Sidebar.scss';

interface SidebarProps {
  isOpen?: boolean;
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
  users?: User[];
  onUserClick?: (user: User) => void;
}

export function Sidebar({
  isOpen = true,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
  users,
  onUserClick,
}: SidebarProps) {
  const { user } = useAuth();
  const currentFolderId = useFilesStore((state) => state.currentFolderId);
  const viewingUserId = useFilesStore((state) => state.viewingUserId);
  
  // Check if admin is at root level (user list)
  const isAdminAtRoot = user?.role === 'admin' && currentFolderId === undefined && !viewingUserId;

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      <div className="sidebar__section">
        <h3 className="sidebar__title">
          {isAdminAtRoot ? 'Users' : 'Folders'}
        </h3>
        {isAdminAtRoot && users && users.length > 0 ? (
          <div className="user-tree">
            {users.map((u) => (
              <div
                key={u.id}
                className={`user-tree__item ${viewingUserId === u.id ? 'user-tree__item--active' : ''}`}
                onClick={() => onUserClick?.(u)}
              >
                {viewingUserId === u.id ? (
                  <IoFolderOpen size={16} className="user-tree__icon" />
                ) : (
                  <IoFolder size={16} className="user-tree__icon" />
                )}
                <span className="user-tree__name">{u.name || u.email}</span>
              </div>
            ))}
          </div>
        ) : (
          <FolderTree
            currentFolderId={currentFolderId}
            onFileDrop={onFileDrop}
            onDropFiles={onDropFiles}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            dragOverFolderId={dragOverFolderId}
          />
        )}
      </div>
    </aside>
  );
}

