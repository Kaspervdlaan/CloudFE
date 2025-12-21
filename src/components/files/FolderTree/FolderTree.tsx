import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { IoFolder, IoFolderOpen } from 'react-icons/io5';
import { useFilesStore } from '../../../store/useFilesStore';
import { useAuth } from '../../../contexts/AuthContext';
import type { File } from '../../../types/file';
import './_FolderTree.scss';

interface FolderTreeProps {
  currentFolderId?: string;
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
}

interface FolderNode extends File {
  children?: FolderNode[];
}

export function FolderTree({
  currentFolderId,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
}: FolderTreeProps) {
  const { user } = useAuth();
  const navigateToFolder = useFilesStore((state) => state.navigateToFolder);
  const allFiles = useFilesStore((state) => state.allFiles);
  const loadAllFolders = useFilesStore((state) => state.loadAllFolders);
  const viewingUserId = useFilesStore((state) => state.viewingUserId);
  const viewingUser = useFilesStore((state) => state.viewingUser);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Load all folders on mount and when viewingUserId changes
  useEffect(() => {
    loadAllFolders().catch(console.error);
  }, [loadAllFolders, viewingUserId]);

  // Build hierarchical tree structure
  const folderTree = useMemo(() => {
    // Get all folders - filter out undefined/null values first
    const folders = allFiles.filter((f): f is File => f != null && f.type === 'folder');
    
    // Create a map for quick lookup
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // First pass: create all folder nodes
    folders.forEach((folder) => {
      if (folder && folder.id) {
        folderMap.set(folder.id, { ...folder, children: [] });
      }
    });

    // Second pass: build tree structure
    folders.forEach((folder) => {
      if (!folder || !folder.id) return;
      
      const node = folderMap.get(folder.id);
      if (!node) return;
      
      if (!folder.parentId || folder.parentId === 'root' || folder.parentId === undefined) {
        // Root level folder
        rootFolders.push(node);
      } else {
        // Child folder
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootFolders.push(node);
        }
      }
    });

    // Sort folders alphabetically
    const sortFolders = (folders: FolderNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach((folder) => {
        if (folder.children) {
          sortFolders(folder.children);
        }
      });
    };

    sortFolders(rootFolders);
    return rootFolders;
  }, [allFiles]);

  // Auto-expand path to current folder
  useEffect(() => {
    if (currentFolderId) {
      const expandPath = (folderId: string | undefined) => {
        if (!folderId) return;
        
        const folder = allFiles.find((f) => f && f.id === folderId && f.type === 'folder');
        if (folder && folder.parentId) {
          setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            newSet.add(folder.parentId!);
            return newSet;
          });
          expandPath(folder.parentId);
        }
      };
      
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentFolderId);
        return newSet;
      });
      expandPath(currentFolderId);
    }
  }, [currentFolderId, allFiles]);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderClick = (folderId: string | undefined) => {
    navigateToFolder(folderId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (hasFiles) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
    
    // Handle drag over - pass undefined for root, folderId for folders
    if (folderId !== undefined) {
      onDragOver?.(folderId);
      // Auto-expand folder when dragging over it
      if (!expandedFolders.has(folderId)) {
        setExpandedFolders((prev) => new Set(prev).add(folderId));
      }
    } else {
      // For root, pass undefined - will be converted to empty string in handler for tracking
      onDragOver?.(undefined);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Check if we're actually leaving the folder item
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragLeave?.();
    }
  };

  const handleDrop = (e: React.DragEvent, folderId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    
    if (hasFiles) {
      // External files from Finder/OS - upload to this folder
      // folderId can be undefined for root (My Drive)
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onDropFiles?.(files, folderId);
      }
    } else {
      // Internal drag - move file/folder to root (undefined = root)
      // If folderId is undefined, move to root
      const draggedFileId = e.dataTransfer.getData('text/plain');
      
      // Don't allow dropping a folder into itself
      if (draggedFileId === folderId) {
        return;
      }
      
      // For root (undefined), pass undefined to move to root
      // For folders, pass the folderId
      onFileDrop?.(draggedFileId, folderId);
    }
    
    onDragLeave?.();
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    if (!folder || !folder.id) return null;
    
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="folder-tree__node">
        <div
          className={`folder-tree__item ${isActive ? 'folder-tree__item--active' : ''} ${isDragOver ? 'folder-tree__item--drag-over' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFolderClick(folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          {hasChildren ? (
            <button
              className="folder-tree__toggle"
              onClick={(e) => toggleFolder(folder.id, e)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ) : (
            <span className="folder-tree__spacer" />
          )}
          {isActive ? (
            <IoFolderOpen size={16} className="folder-tree__icon" />
          ) : (
            <IoFolder size={16} className="folder-tree__icon" />
          )}
          <span className="folder-tree__name">{folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="folder-tree__children">
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Check if root is being dragged over
  // We use an empty string to represent root in dragOverFolderId
  const isRootDragOver = dragOverFolderId === '';

  return (
    <div className="folder-tree">
      <div
        className={`folder-tree__item ${!currentFolderId ? 'folder-tree__item--active' : ''} ${isRootDragOver ? 'folder-tree__item--drag-over' : ''}`}
        onClick={() => handleFolderClick(undefined)}
        onDragOver={(e) => handleDragOver(e, undefined)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, undefined)}
      >
        {!currentFolderId ? (
          <IoFolderOpen size={16} className="folder-tree__icon" />
        ) : (
          <IoFolder size={16} className="folder-tree__icon" />
        )}
        <span className="folder-tree__name">
          {viewingUser 
            ? `${viewingUser.name || viewingUser.email}'s Drive`
            : user?.name 
              ? `${user.name}'s Drive` 
              : 'My Drive'
          }
        </span>
      </div>
      {folderTree.map((folder) => renderFolder(folder, 0))}
    </div>
  );
}
