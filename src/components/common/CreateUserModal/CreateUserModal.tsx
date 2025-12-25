import { useState, type FormEvent } from 'react';
import { MdClose, MdPersonAdd, MdEmail, MdLock, MdPerson } from 'react-icons/md';
import { Button } from '../Button/Button';
import { authApi, getToken, setToken } from '../../../services/authApi';
import './_CreateUserModal.scss';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Save the current admin token before registering
      const currentToken = getToken();
      
      // Call register endpoint to create the user
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      
      // Restore the admin's token (register sets a new token, but we want to stay logged in as admin)
      if (currentToken) {
        setToken(currentToken);
      }
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      onUserCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-user-modal-overlay" onClick={handleOverlayClick}>
      <div className="create-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-user-modal__header">
          <div className="create-user-modal__icon">
            <MdPersonAdd size={24} />
          </div>
          <h2 className="create-user-modal__title">Create New User</h2>
          <button
            className="create-user-modal__close"
            onClick={handleClose}
            aria-label="Close"
            disabled={isLoading}
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-user-modal__body">
          {error && (
            <div className="create-user-modal__error">
              {error}
            </div>
          )}

          <div className="create-user-modal__field">
            <label htmlFor="name" className="create-user-modal__label">
              Name
            </label>
            <div className="create-user-modal__input-wrapper">
              <MdPerson size={20} className="create-user-modal__input-icon" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user's name"
                required
                disabled={isLoading}
                className="create-user-modal__input"
              />
            </div>
          </div>

          <div className="create-user-modal__field">
            <label htmlFor="email" className="create-user-modal__label">
              Email
            </label>
            <div className="create-user-modal__input-wrapper">
              <MdEmail size={20} className="create-user-modal__input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user's email"
                required
                disabled={isLoading}
                className="create-user-modal__input"
              />
            </div>
          </div>

          <div className="create-user-modal__field">
            <label htmlFor="password" className="create-user-modal__label">
              Password
            </label>
            <div className="create-user-modal__input-wrapper">
              <MdLock size={20} className="create-user-modal__input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min. 6 characters)"
                required
                disabled={isLoading}
                minLength={6}
                className="create-user-modal__input"
              />
            </div>
          </div>

          <div className="create-user-modal__field">
            <label htmlFor="confirmPassword" className="create-user-modal__label">
              Confirm Password
            </label>
            <div className="create-user-modal__input-wrapper">
              <MdLock size={20} className="create-user-modal__input-icon" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                disabled={isLoading}
                minLength={6}
                className="create-user-modal__input"
              />
            </div>
          </div>

          <div className="create-user-modal__footer">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

