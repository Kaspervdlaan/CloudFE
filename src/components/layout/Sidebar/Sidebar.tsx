import { FolderTree } from '../../files/FolderTree/FolderTree';
import { useFilesStore } from '../../../store/useFilesStore';
import './_Sidebar.scss';

interface SidebarProps {
  isOpen?: boolean;
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
}

export function Sidebar({
  isOpen = true,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
}: SidebarProps) {
  const currentFolderId = useFilesStore((state) => state.currentFolderId);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      <div className="sidebar__section">
        <h3 className="sidebar__title">Folders</h3>
        <FolderTree
          currentFolderId={currentFolderId}
          onFileDrop={onFileDrop}
          onDropFiles={onDropFiles}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          dragOverFolderId={dragOverFolderId}
        />
      </div>
    </aside>
  );
}
