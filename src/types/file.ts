export interface FileMetadata {
  size: number;
  mimeType: string;
  extension: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  path?: string;
  size?: number;
  mimeType?: string;
  extension?: string;
  metadata?: FileMetadata;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

// Keep File as an alias for backward compatibility during migration
export type File = DriveFile;

export interface Folder extends DriveFile {
  type: 'folder';
  childrenCount?: number;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  path?: string;
}

export interface FileOperationRequest {
  destinationId?: string;
  destinationPath?: string;
}

