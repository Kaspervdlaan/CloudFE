import type { User } from '../../../types/auth';
import { MdPerson, MdDelete } from 'react-icons/md';
import './_UserList.scss';

interface UserListProps {
  users: User[];
  onUserClick: (user: User) => void;
  onUserDelete?: (user: User) => void;
  currentUserId?: string; // To prevent deleting yourself
  viewMode?: 'list' | 'grid'; // View mode: list or grid
}

export function UserList({ users, onUserClick, onUserDelete, currentUserId, viewMode = 'grid' }: UserListProps) {
  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation(); // Prevent triggering onUserClick
    onUserDelete?.(user);
  };

  return (
    <div className={`user-list user-list--${viewMode}`}>
      {users.map((user) => (
        <div
          key={user.id}
          className={`user-item user-item--${viewMode}`}
          onClick={() => onUserClick(user)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick(user);
            }
          }}
        >
          <div className="user-item__icon">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="user-item__avatar" />
            ) : (
              <MdPerson size={viewMode === 'list' ? 32 : 48} />
            )}
          </div>
          <div className="user-item__info">
            <div className="user-item__name">{user.name || user.email}</div>
            <div className="user-item__email">{user.email}</div>
            {viewMode === 'list' && (
              <div className="user-item__id">ID: {user.id}</div>
            )}
          </div>
          {viewMode === 'grid' && (
            <div className="user-item__id">ID: {user.id}</div>
          )}
          {onUserDelete && user.id !== currentUserId && (
            <button
              className="user-item__delete"
              onClick={(e) => handleDeleteClick(e, user)}
              title={`Delete user ${user.name || user.email}`}
              aria-label={`Delete user ${user.name || user.email}`}
              type="button"
            >
              <MdDelete size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

