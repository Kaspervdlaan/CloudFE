import { useState, useRef, useEffect, type MouseEvent } from 'react';
import {
  File as FileIcon,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Share2,
} from 'lucide-react';
import { IoFolder, IoFolderOpen } from 'react-icons/io5';
import type { File } from '../../../types/file';
import { getFileIconName, isImageFile, formatFileSize } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import { ContextMenu, ContextMenuItem } from '../../common/ContextMenu/ContextMenu';
import './_FileItem.scss';

interface FileItemProps {
  file: File;
  onDoubleClick?: () => void;
  onDoubleClickFileName?: (file: File, newName: string) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDrop?: (draggedFileId: string, targetFolderId: string) => void;
  onDropFiles?: (files: FileList, targetFolderId: string) => void;
  onDragOver?: (folderId: string) => void;
  onDragLeave?: () => void;
  onDropComplete?: () => void;
  isDragOver?: boolean;
  viewMode?: 'list' | 'grid';
  shouldStartRenaming?: boolean;
  currentFolderId?: string;
}

const iconMap: Record<string, any> = {
  folder: IoFolder,
  image: Image,
  video: Video,
  music: Music,
  'file-text': FileText,
  archive: Archive,
  file: FileIcon,
};

export function FileItem({
  file,
  onDoubleClick,
  onDoubleClickFileName,
  onDelete,
  onDownload,
  onShare,
  onDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  onDropComplete,
  isDragOver,
  viewMode = 'list',
  shouldStartRenaming = false,
  currentFolderId,
}: FileItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileName, setFileName] = useState(file.name);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    file.thumbnailUrl?.startsWith('data:') ? file.thumbnailUrl : undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Update fileName when file.name changes (e.g., after rename from context menu)
  useEffect(() => {
    setFileName(file.name);
  }, [file.name]);

  // Load thumbnail with authentication if needed
  useEffect(() => {
    if (!isImageFile(file)) return;
    
    // If we already have a data URL thumbnail, use it
    if (file.thumbnailUrl?.startsWith('data:')) {
      setThumbnailUrl(file.thumbnailUrl);
      return;
    }

    // If we don't have a thumbnail URL or it's a regular URL that needs auth, fetch it
    if (!thumbnailUrl && (file.thumbnailUrl || file.downloadUrl)) {
      const loadThumbnail = async () => {
        try {
          const blob = await api.downloadFile(file.id);
          const blobUrl = URL.createObjectURL(blob);
          setThumbnailUrl(blobUrl);
        } catch (err) {
          console.error(`Failed to load thumbnail for ${file.id}:`, err);
        }
      };
      loadThumbnail();
    }
  }, [file.id, file.thumbnailUrl, file.downloadUrl]);

  // Clean up blob URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  // Auto-enter rename mode if shouldStartRenaming is true
  useEffect(() => {
    if (shouldStartRenaming && !isRenaming) {
      setIsRenaming(true);
      setFileName(file.name);
    }
  }, [shouldStartRenaming, isRenaming, file.name]);

  // Auto-focus and select text when entering rename mode
  // Keep focus maintained, especially for newly created folders
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const focusInput = () => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      };
      // Focus immediately
      focusInput();
      // Also focus on next tick to handle any async rendering
      setTimeout(focusInput, 0);
      // Keep checking focus periodically while renaming (for newly created folders)
      // This ensures the input stays focused until user presses Enter
      if (shouldStartRenaming) {
        const focusInterval = setInterval(focusInput, 100);
        return () => clearInterval(focusInterval);
      }
    }
  }, [isRenaming, shouldStartRenaming]);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDoubleClickFileName = (e: MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setFileName(file.name);
  };

  const handleNameClick = (e: MouseEvent) => {
    // Stop propagation so clicking the name doesn't trigger the item click
    e.stopPropagation();
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (isRenaming) return;
    
    const target = e.target as HTMLElement;
    const isMobile = window.innerWidth <= 768;
    
    // Don't open if clicking on the name or menu button
    if (target.closest('.file-item__name') || target.closest('.file-item__menu')) {
      return;
    }
    
    // In list mode
    if (viewMode === 'list') {
      // On mobile, single click anywhere (including icon) opens it
      if (isMobile) {
        onDoubleClick?.();
      }
      // On desktop, single click anywhere except icon opens it
      else if (!target.closest('.file-item__icon')) {
        onDoubleClick?.();
      }
    }
    // In grid mode on mobile, single click opens it (for folders and files)
    else if (viewMode === 'grid' && isMobile) {
      onDoubleClick?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isRenaming) return;
    
    // Enter key opens the file/folder
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick?.();
    }
    // Space key also opens (common pattern for buttons)
    else if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick?.();
    }
  };

  const handleRenameFromContextMenu = () => {
    setIsRenaming(true);
    setFileName(file.name);
    handleCloseContextMenu();
  };

  const handleSaveRename = () => {
    const trimmedName = fileName.trim();
    if (trimmedName && trimmedName !== file.name) {
      onDoubleClickFileName?.(file, trimmedName);
    } else {
      // Reset to original name if empty or unchanged
      setFileName(file.name);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setFileName(file.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelRename();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging while renaming
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
    // Create a drag image
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    // Don't allow dropping while renaming
    if (isRenaming) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (hasFiles) {
      // External files - allow drop
      e.dataTransfer.dropEffect = 'copy';
    } else {
      // Internal drag - move effect
      e.dataTransfer.dropEffect = 'move';
    }
    
    onDragOver?.(file.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    // Check if we're actually leaving the folder element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragLeave?.();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    
    if (hasFiles) {
      // External files from Finder/OS - upload to this folder
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onDropFiles?.(files, file.id);
      }
    } else {
      // Internal drag - move file/folder
      const draggedFileId = e.dataTransfer.getData('text/plain');
      
      // Don't allow dropping a folder into itself
      if (draggedFileId === file.id) {
        return;
      }
      
      onDrop?.(draggedFileId, file.id);
    }
    
    onDragLeave?.();
    onDropComplete?.();
  };

  const iconName = getFileIconName(file);
  let Icon = iconMap[iconName] || FileIcon;
  
  // Use IoFolderOpen for the current folder, IoFolder for others
  if (file.type === 'folder') {
    Icon = currentFolderId === file.id ? IoFolderOpen : IoFolder;
  }

  return (
    <>
      <div
        className={`file-item file-item--${viewMode} ${isDragging ? 'file-item--dragging' : ''} ${isDragOver ? 'file-item--drag-over' : ''}`}
        role="button"
        tabIndex={isRenaming ? -1 : 0}
        aria-label={`${file.type === 'folder' ? 'Folder' : 'File'}: ${file.name}. Press Enter to open.`}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        onClick={handleItemClick}
        onKeyDown={handleKeyDown}
      >
        <div className="file-item__content">
          <div className="file-item__icon" onDoubleClick={onDoubleClick}>
            {isImageFile(file) && thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={file.name} 
                className="file-item__thumbnail"
              />
            ) : (
              <Icon size={viewMode === 'grid' ? 64 : 24} />
            )}
          </div>
          <div className="file-item__info">
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                className="file-item__name file-item__name--editing"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onBlur={(e) => {
                  // For newly created folders, don't save on blur - wait for Enter
                  // Only save on blur if it's not a newly created folder
                  if (!shouldStartRenaming) {
                    handleSaveRename();
                  } else {
                    // Keep focus if it's a newly created folder
                    e.target.focus();
                  }
                }}
                onKeyDown={handleRenameKeyDown}
              />
            ) : (
              <div 
                className="file-item__name" 
                title={file.name} 
                onClick={handleNameClick}
                onDoubleClick={handleDoubleClickFileName}
              >
                {file.name}
              </div>
              )}

              {file.type === 'file' && file.size && (
                <div className="file-item__size">{formatFileSize(file.size)}</div>
              )}
            </div>
          </div>
        <button className="file-item__menu" onClick={handleContextMenu}>
          <MoreVertical size={18} />
        </button>
      </div>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleCloseContextMenu}>
          <ContextMenuItem onClick={handleRenameFromContextMenu}>
            <span className="context-menu__item-content">
              <Edit size={16} />
              <span>Rename</span>
            </span>
          </ContextMenuItem>
          {onShare && file.type === 'folder' && (
            <ContextMenuItem onClick={() => { onShare(); handleCloseContextMenu(); }}>
              <span className="context-menu__item-content">
                <Share2 size={16} />
                <span>Share Folder</span>
              </span>
            </ContextMenuItem>
          )}
          {onDownload && file.type === 'file' && (
            <ContextMenuItem onClick={() => { onDownload(); handleCloseContextMenu(); }}>
              <span className="context-menu__item-content">
                <Download size={16} />
                <span>Download</span>
              </span>
            </ContextMenuItem>
          )}
          {onDelete && (
            <ContextMenuItem onClick={() => { onDelete(); handleCloseContextMenu(); }} danger>
              <span className="context-menu__item-content">
                <Trash2 size={16} />
                <span>Delete</span>
              </span>
            </ContextMenuItem>
          )}
        </ContextMenu>
      )}
    </>
  );
}

