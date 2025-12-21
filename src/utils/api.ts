import type { File, Folder, CreateFolderRequest } from '../types/file';
import type { APIResponse, APIError } from '../types/api';
import { getApiUrl } from '../config/api';
import { getToken } from '../services/authApi';

/**
 * Get default headers with authentication
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = getToken();
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<APIResponse<T>> {
  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      // Clear token and redirect
      localStorage.removeItem('drive-auth-token');
      window.location.href = '/';
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData: APIError = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Real API client for Drive backend
 */
export const api = {
  /**
   * Get files (list files in a folder)
   */
  async getFiles(parentId?: string, userId?: string): Promise<APIResponse<File[]>> {
    const params = new URLSearchParams();
    if (parentId) {
      params.append('parentId', parentId);
    }
    if (userId) {
      params.append('userId', userId);
    }
    
    const url = params.toString()
      ? getApiUrl(`files?${params.toString()}`)
      : getApiUrl('files');
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<File[]>(response);
  },

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}`), {
      headers: getHeaders(),
    });
    return handleResponse<File>(response);
  },

  /**
   * Upload files
   */
  async uploadFiles(
    files: FileList | globalThis.File[],
    parentId?: string
  ): Promise<APIResponse<File[]>> {
    const formData = new FormData();
    
    // Convert FileList to array if needed
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    
    // Add all files to FormData (using DOM File type)
    fileArray.forEach((file: globalThis.File) => {
      formData.append('files', file);
    });
    
    // Add parentId if provided
    if (parentId) {
      formData.append('parentId', parentId);
    }
    
    const response = await fetch(getApiUrl('files/upload'), {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    
    return handleResponse<File[]>(response);
  },

  /**
   * Create folder
   */
  async createFolder(request: CreateFolderRequest): Promise<APIResponse<Folder>> {
    const response = await fetch(getApiUrl('files/folders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify(request),
    });
    
    return handleResponse<Folder>(response);
  },

  /**
   * Rename file/folder
   */
  async renameFile(fileId: string, newName: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/rename`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ name: newName }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Move file/folder
   */
  async moveFile(
    fileId: string,
    destinationId?: string
  ): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/move`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ destinationId: destinationId || null }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Copy file/folder
   */
  async copyFile(fileId: string, destinationId: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/copy`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ destinationId }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Delete file/folder
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // 204 No Content - no body to parse
    if (response.status !== 204) {
      await response.json();
    }
  },

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/download`), {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return response.blob();
  },

  /**
   * Share a folder with a user
   */
  async shareFolder(fileId: string, userId: string, permission: 'read' | 'write' = 'read'): Promise<APIResponse<any>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/share`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ userId, permission }),
    });
    
    return handleResponse<any>(response);
  },

  /**
   * Unshare a folder with a user
   */
  async unshareFolder(fileId: string, userId: string): Promise<void> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/share/${encodeURIComponent(userId)}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    if (response.status !== 204) {
      await response.json();
    }
  },

  /**
   * Get list of users a folder is shared with
   */
  async getFolderShares(fileId: string): Promise<APIResponse<any[]>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/shares`), {
      headers: getHeaders(),
    });
    
    return handleResponse<any[]>(response);
  },

  /**
   * Get folders shared with current user
   */
  async getSharedFolders(): Promise<APIResponse<File[]>> {
    const response = await fetch(getApiUrl('files/shared/folders'), {
      headers: getHeaders(),
    });
    
    return handleResponse<File[]>(response);
  },
};

