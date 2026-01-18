import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPersonAdd, MdGridOn, MdList } from 'react-icons/md';
import { Layout } from '../../components/layout/Layout/Layout';
import { UserList } from '../../components/files/UserList/UserList';
import { CreateUserModal } from '../../components/common/CreateUserModal/CreateUserModal';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal/DeleteConfirmModal';
import { Button } from '../../components/common/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useFilesStore } from '../../store/useFilesStore';
import { authApi } from '../../services/authApi';
import type { User } from '../../types/auth';
import './_Admin.scss';

export function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setViewingUserId, navigateToFolder } = useFilesStore();
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('admin-view-mode');
    return (saved === 'list' || saved === 'grid') ? saved : 'list';
  });

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const users = await authApi.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('admin-view-mode', mode);
  };

  const handleUserClick = (selectedUser: User) => {
    setViewingUserId(selectedUser.id, selectedUser);
    navigateToFolder(undefined);
    navigate('/drive');
  };

  const handleUserDelete = (selectedUser: User) => {
    setUserToDelete(selectedUser);
  };

  const confirmUserDelete = async () => {
    if (userToDelete) {
      try {
        await authApi.deleteUser(userToDelete.id);
        setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  return (
    <Layout
      onSearch={() => {}}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      showSearch={false}
      showViewToggle={false}
      showSidebar={false}
    >
      <div className="admin">
        <div className="admin__toolbar">
          <div className="admin__header">
            <h1 className="admin__title">User Management</h1>
            <p className="admin__subtitle">{allUsers.length} users registered</p>
          </div>
          <div className="admin__actions">
            <div className="admin__view-toggle">
              <button
                className={`admin__view-button ${viewMode === 'grid' ? 'admin__view-button--active' : ''}`}
                onClick={() => handleViewModeChange('grid')}
                title="Grid view"
              >
                <MdGridOn size={18} />
              </button>
              <button
                className={`admin__view-button ${viewMode === 'list' ? 'admin__view-button--active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                title="List view"
              >
                <MdList size={18} />
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsCreateUserModalOpen(true)}
              className="admin__create-user"
            >
              <MdPersonAdd size={20} />
              <span>Create User</span>
            </Button>
          </div>
        </div>

        <div className="admin__content">
          {usersLoading && <div className="admin__loading">Loading users...</div>}
          {!usersLoading && allUsers.length === 0 && (
            <div className="admin__empty">
              <p>No users found.</p>
            </div>
          )}
          {!usersLoading && allUsers.length > 0 && (
            <UserList
              users={allUsers}
              onUserClick={handleUserClick}
              onUserDelete={handleUserDelete}
              currentUserId={user?.id}
              viewMode={viewMode}
            />
          )}
        </div>

        <DeleteConfirmModal
          isOpen={userToDelete !== null}
          fileName={userToDelete?.name || userToDelete?.email || ''}
          fileType="user"
          onClose={() => setUserToDelete(null)}
          onConfirm={confirmUserDelete}
        />

        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onUserCreated={loadAllUsers}
        />
      </div>
    </Layout>
  );
}
