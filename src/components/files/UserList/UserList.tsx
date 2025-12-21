import type { User } from '../../../types/auth';
import { User as UserIcon, Trash2 } from 'lucide-react';
import './_UserList.scss';

interface UserListProps {
  users: User[];
  onUserClick: (user: User) => void;
  onUserDelete?: (user: User) => void;
  currentUserId?: string; // To prevent deleting yourself
}

export function UserList({ users, onUserClick, onUserDelete, currentUserId }: UserListProps) {
  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation(); // Prevent triggering onUserClick
    onUserDelete?.(user);
  };

  return (
    <div className="user-list">
      {users.map((user) => (
        <div
          key={user.id}
          className="user-item"
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
              <UserIcon size={48} />
            )}
          </div>
          <div className="user-item__info">
            <div className="user-item__name">{user.name || user.email}</div>
            <div className="user-item__email">{user.email}</div>
            <div className="user-item__id">ID: {user.id}</div>
          </div>
          {onUserDelete && user.id !== currentUserId && (
            <button
              className="user-item__delete"
              onClick={(e) => handleDeleteClick(e, user)}
              title={`Delete user ${user.name || user.email}`}
              aria-label={`Delete user ${user.name || user.email}`}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

