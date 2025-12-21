import type { File } from '../../../types/file';
import { FileItem } from '../FileItem/FileItem';
import './_FileGrid.scss';

interface FileGridProps {
  files: File[];
  onFileDoubleClick: (file: File) => void;
  onDoubleClickFileName: (file: File, newName: string) => void;
  onFileDelete: (file: File) => void;
  onFileDownload: (file: File) => void;
  onFileShare?: (file: File) => void;
  onFileDrop?: (draggedFileId: string, targetFolderId: string) => void;
  onDropFiles?: (files: FileList, targetFolderId: string) => void;
  onDragOver?: (folderId: string) => void;
  onDragLeave?: () => void;
  onDropComplete?: () => void;
  dragOverFolderId?: string | null;
  fileToRename?: string | null;
  currentFolderId?: string;
}

export function FileGrid({
  files,
  onFileDoubleClick,
  onDoubleClickFileName,
  onFileDelete,
  onFileDownload,
  onFileShare,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  onDropComplete,
  dragOverFolderId,
  fileToRename,
  currentFolderId,
}: FileGridProps) {
  return (
    <div className="file-grid">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          viewMode="grid"
          onDoubleClick={() => onFileDoubleClick(file)}
          onDoubleClickFileName={(f, newName) => onDoubleClickFileName(f, newName)}
          onDelete={() => onFileDelete(file)}
          onDownload={() => onFileDownload(file)}
          onShare={onFileShare && file.type === 'folder' ? () => onFileShare(file) : undefined}
          onDrop={onFileDrop}
          onDropFiles={onDropFiles}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDropComplete={onDropComplete}
          isDragOver={dragOverFolderId === file.id}
          shouldStartRenaming={fileToRename === file.id}
          currentFolderId={currentFolderId}
        />
      ))}
    </div>
  );
}

