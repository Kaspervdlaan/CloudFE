import type { RegisterRequest, LoginRequest, AuthResponse, User } from '../types/auth';
import { getApiUrl } from '../config/api';

const TOKEN_KEY = 'drive-auth-token';

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store auth token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove auth token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  return data.data || data;
}

/**
 * Authentication API client
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const authResponse = await handleResponse<AuthResponse>(response);
    setToken(authResponse.token);
    return authResponse;
  },

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const authResponse = await handleResponse<AuthResponse>(response);
    setToken(authResponse.token);
    return authResponse;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl('auth/me'), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse<User>(response);
  },

  /**
   * Initiate Google OAuth flow
   */
  initiateGoogleAuth(): void {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    window.location.href = `${apiBaseUrl}/auth/google`;
  },

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl('auth/users'), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse<User[]>(response);
  },

  /**
   * Get users for sharing (available to all authenticated users)
   */
  async getUsersForSharing(): Promise<User[]> {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl('auth/users/sharing'), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse<User[]>(response);
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl(`auth/users/${encodeURIComponent(userId)}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  },

  /**
   * Logout (client-side only, removes token)
   */
  logout(): void {
    removeToken();
  },
};

