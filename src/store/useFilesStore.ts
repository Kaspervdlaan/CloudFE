import { create } from 'zustand';
import type { File, CreateFolderRequest } from '../types/file';
import type { User } from '../types/auth';
import { api } from '../utils/api';

interface FilesState {
  files: File[];
  allFiles: File[]; // All files and folders for tree building (cached)
  currentFolderId: string | undefined;
  viewingUserId: string | undefined; // For admin to view specific user's files
  viewingUser: User | null; // The user being viewed (for admin)
  loading: boolean;
  error: string | null;
  loadFiles: (parentId?: string, userId?: string) => Promise<void>;
  uploadFiles: (files: FileList | globalThis.File[], parentId?: string) => Promise<void>;
  createFolder: (request: CreateFolderRequest) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, destinationId: string | undefined) => Promise<void>;
  copyFile: (fileId: string, destinationId: string) => Promise<void>;
  navigateToFolder: (folderId: string | undefined) => Promise<void>;
  refreshFiles: () => Promise<void>;
  getAllFolders: () => File[];
  getFileById: (fileId: string) => File | undefined;
  getCurrentFolderName: (userName?: string) => string;
  loadAllFolders: () => Promise<void>; // Load all folders for tree view
  setViewingUserId: (userId: string | undefined, user?: User | null) => void; // Set which user's files to view (admin only)
  reset: () => void; // Reset store to initial state (used on logout)
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  allFiles: [], // Start empty, will be loaded from API
  currentFolderId: undefined,
  viewingUserId: undefined, // For admin to view specific user's files
  viewingUser: null, // The user being viewed (for admin)
  loading: false,
  error: null,

  loadFiles: async (parentId?: string, userId?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      // Use viewingUserId from state if userId not provided
      const targetUserId = userId !== undefined ? userId : state.viewingUserId;
      const response = await api.getFiles(parentId, targetUserId);
      const fetchedFiles = response.data;
      
      // Update allFiles cache with fetched files
      set((currentState) => {
        const existingIds = new Set(currentState.allFiles.map((f) => f.id));
        const newFiles = fetchedFiles.filter((f) => !existingIds.has(f.id));
        const updatedFiles = currentState.allFiles.map((f) => {
          const updated = fetchedFiles.find((nf) => nf.id === f.id);
          return updated || f;
        });
        
        return {
          allFiles: [...updatedFiles, ...newFiles],
          files: fetchedFiles,
          currentFolderId: parentId,
          loading: false,
        };
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to load files',
        loading: false,
      });
    }
  },

  loadAllFolders: async () => {
    try {
      // Fetch all files to get all folders for tree view
      const state = get();
      const response = await api.getFiles(undefined, state.viewingUserId);
      const allItems = response.data;
      
      // Also try to get files from common parent folders to build complete tree
      // For now, we'll update allFiles with what we have
      set((currentState) => {
        const existingIds = new Set(currentState.allFiles.map((f) => f.id));
        const newItems = allItems.filter((f) => !existingIds.has(f.id));
        const updatedItems = currentState.allFiles.map((f) => {
          const updated = allItems.find((nf) => nf.id === f.id);
          return updated || f;
        });
        
        return {
          allFiles: [...updatedItems, ...newItems],
        };
      });
    } catch (err: any) {
      console.error('Failed to load all folders:', err);
    }
  },

  uploadFiles: async (fileList: FileList | globalThis.File[], parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const targetParentId = parentId !== undefined ? parentId : (state.currentFolderId || undefined);
      
      const response = await api.uploadFiles(fileList, targetParentId);
      const uploadedFiles = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, ...uploadedFiles],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      await get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload files', loading: false });
    }
  },

  createFolder: async (request: CreateFolderRequest) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const targetParentId = request.parentId !== undefined ? request.parentId : (state.currentFolderId || undefined);
      
      const folderRequest = {
        ...request,
        parentId: targetParentId,
      };
      
      const response = await api.createFolder(folderRequest);
      const newFolder = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, newFolder],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      await get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to create folder', loading: false });
    }
  },

  deleteFile: async (fileId: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteFile(fileId);
      
      // Remove from allFiles cache (recursive removal handled by backend)
      set((currentState) => {
        const removeRecursive = (id: string, files: File[]): File[] => {
          return files.filter((f) => {
            if (f.id === id) {
              return false;
            }
            // Also remove children
            if (f.parentId === id) {
              return false;
            }
            return true;
          }).map((f) => {
            // Recursively remove children of children
            if (f.parentId === id) {
              return removeRecursive(f.id, [f])[0];
            }
            return f;
          });
        };
        
        const updatedAllFiles = removeRecursive(fileId, currentState.allFiles);
        const updatedFiles = currentState.files.filter((f) => f.id !== fileId && f.parentId !== fileId);
        
        return {
          allFiles: updatedAllFiles,
          files: updatedFiles,
          loading: false,
          error: null, // Clear any errors
        };
      });
      
      // Silently reload files to refresh the view (don't show errors if reload fails)
      // The file was successfully deleted, so reload errors are not critical
      try {
        const state = get();
        const targetUserId = state.viewingUserId;
        const response = await api.getFiles(state.currentFolderId, targetUserId);
        const fetchedFiles = response.data;
        
        // Update files list without setting error state
        set((currentState) => {
          const existingIds = new Set(currentState.allFiles.map((f) => f.id));
          const newFiles = fetchedFiles.filter((f) => !existingIds.has(f.id));
          const updatedFiles = currentState.allFiles.map((f) => {
            const updated = fetchedFiles.find((nf) => nf.id === f.id);
            return updated || f;
          });
          
          return {
            allFiles: [...updatedFiles, ...newFiles],
            files: fetchedFiles,
            error: null, // Ensure error stays cleared
          };
        });
      } catch (reloadErr: any) {
        // Silently ignore reload errors after successful deletion
        // The file was deleted successfully, so reload errors are not critical
        console.debug('Error reloading files after deletion (non-critical):', reloadErr);
        // Don't set error state - deletion was successful
      }
    } catch (err: any) {
      // Only show error if deletion itself failed
      set({ error: err.message || 'Failed to delete file', loading: false });
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.renameFile(fileId, newName);
      const updatedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: currentState.allFiles.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
        loading: false,
      }));
      
      // Reload files to refresh the view
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename file', loading: false });
    }
  },

  moveFile: async (fileId: string, destinationId: string | undefined) => {
    set({ loading: true, error: null });
    try {
      const response = await api.moveFile(fileId, destinationId);
      const updatedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: currentState.allFiles.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
        loading: false,
      }));
      
      // Reload files for current folder to reflect the change
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to move file', loading: false });
    }
  },

  copyFile: async (fileId: string, destinationId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.copyFile(fileId, destinationId);
      const copiedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, copiedFile],
        loading: false,
      }));
      
      // Reload files to refresh the view
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to copy file', loading: false });
    }
  },

  navigateToFolder: async (folderId: string | undefined) => {
    await get().loadFiles(folderId);
  },

  refreshFiles: async () => {
    const state = get();
    await get().loadFiles(state.currentFolderId);
  },

  getAllFolders: () => {
    const state = get();
    return state.allFiles.filter((f) => f.type === 'folder');
  },

  getFileById: (fileId: string) => {
    const state = get();
    return state.allFiles.find((f) => f.id === fileId);
  },

  getCurrentFolderName: (userName?: string) => {
    const state = get();
    const defaultName = userName ? `${userName}'s Drive` : 'My Drive';
    if (state.currentFolderId === undefined) {
      return defaultName;
    }
    const folder = state.allFiles.find((f) => f.id === state.currentFolderId && f.type === 'folder');
    return folder ? folder.name : defaultName;
  },

  setViewingUserId: (userId: string | undefined, user?: User | null) => {
    set({ 
      viewingUserId: userId, 
      viewingUser: user || null, 
      currentFolderId: undefined,
      allFiles: [], // Clear cache when switching users
    });
    // Reload files with new userId
    get().loadFiles(undefined, userId);
  },

  reset: () => {
    set({
      files: [],
      allFiles: [],
      currentFolderId: undefined,
      viewingUserId: undefined,
      viewingUser: null,
      loading: false,
      error: null,
    });
  },
}));
