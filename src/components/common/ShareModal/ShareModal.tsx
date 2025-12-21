import { useState, useEffect, type FormEvent } from 'react';
import { X, Share2, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '../Button/Button';
import { api } from '../../../utils/api';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../contexts/AuthContext';
import type { User } from '../../../types/auth';
import './_ShareModal.scss';

interface ShareModalProps {
  isOpen: boolean;
  folderId: string;
  folderName: string;
  onClose: () => void;
  onShareUpdate?: () => void;
}

interface ShareInfo {
  id: string;
  shared_with_user_id: string;
  permission: 'read' | 'write';
  user_id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export function ShareModal({
  isOpen,
  folderId,
  folderName,
  onClose,
  onShareUpdate,
}: ShareModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [loading, setLoading] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadShares();
    }
  }, [isOpen, folderId]);

  const loadUsers = async () => {
    try {
      const users = await authApi.getUsersForSharing();
      setAllUsers(users);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load users');
    }
  };

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const response = await api.getFolderShares(folderId);
      setShares(response.data || []);
    } catch (err: any) {
      console.error('Failed to load shares:', err);
      setError(err.message || 'Failed to load shares');
    } finally {
      setLoadingShares(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    try {
      await api.shareFolder(folderId, selectedUserId, permission);
      await loadShares();
      setSelectedUserId('');
      setPermission('read');
      onShareUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to share folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.unshareFolder(folderId, userId);
      await loadShares();
      onShareUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to unshare folder');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const { user: currentUser } = useAuth();
  
  // Filter out users who already have access and the current user
  const availableUsers = allUsers.filter(
    (user) => user.id !== currentUser?.id && !shares.some((share) => share.shared_with_user_id === user.id)
  );

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <div className="share-modal__icon">
            <Share2 size={24} />
          </div>
          <h2 className="share-modal__title">Share Folder</h2>
          <button
            className="share-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="share-modal__body">
          <p className="share-modal__folder-name">
            <strong>{folderName}</strong>
          </p>

          {error && (
            <div className="share-modal__error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="share-modal__form">
            <div className="share-modal__form-group">
              <label htmlFor="user-select" className="share-modal__label">
                Share with
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="share-modal__select"
                disabled={loading || availableUsers.length === 0}
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="share-modal__form-group">
              <label htmlFor="permission-select" className="share-modal__label">
                Permission
              </label>
              <select
                id="permission-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
                className="share-modal__select"
                disabled={loading}
              >
                <option value="read">Read only</option>
                <option value="write">Read & Write</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!selectedUserId || loading || availableUsers.length === 0}
              className="share-modal__share-button"
            >
              <UserPlus size={16} />
              <span>Share</span>
            </Button>
          </form>

          <div className="share-modal__shares">
            <h3 className="share-modal__shares-title">Shared with</h3>
            {loadingShares ? (
              <div className="share-modal__loading">Loading...</div>
            ) : shares.length === 0 ? (
              <div className="share-modal__empty">No users have access to this folder yet.</div>
            ) : (
              <ul className="share-modal__shares-list">
                {shares.map((share) => (
                  <li key={share.id} className="share-modal__share-item">
                    <div className="share-modal__share-info">
                      <div className="share-modal__share-avatar">
                        {share.avatar_url ? (
                          <img src={share.avatar_url} alt={share.name} />
                        ) : (
                          <span>{share.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="share-modal__share-details">
                        <div className="share-modal__share-name">{share.name}</div>
                        <div className="share-modal__share-email">{share.email}</div>
                      </div>
                    </div>
                    <div className="share-modal__share-actions">
                      <span className="share-modal__share-permission">
                        {share.permission === 'write' ? 'Read & Write' : 'Read only'}
                      </span>
                      <button
                        className="share-modal__unshare-button"
                        onClick={() => handleUnshare(share.shared_with_user_id)}
                        disabled={loading}
                        aria-label="Remove access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

