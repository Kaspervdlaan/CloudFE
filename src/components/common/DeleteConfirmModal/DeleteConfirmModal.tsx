import { type FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '../Button/Button';
import './_DeleteConfirmModal.scss';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  fileType: 'file' | 'folder' | 'user';
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  fileName,
  fileType,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="delete-confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirm-modal__header">
          <div className="delete-confirm-modal__icon">
            <Trash2 size={24} />
          </div>
          <h2 className="delete-confirm-modal__title">
            Delete {fileType === 'folder' ? 'Folder' : fileType === 'user' ? 'User' : 'File'}?
          </h2>
          <button
            className="delete-confirm-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="delete-confirm-modal__body">
          <p className="delete-confirm-modal__message">
            Are you sure you want to delete <strong>"{fileName}"</strong>?
            {fileType === 'folder' && ' This will also delete all files and folders inside it.'}
            {fileType === 'user' && ' This will also delete all files and folders owned by this user. This action cannot be undone.'}
          </p>
          <p className="delete-confirm-modal__warning">This action cannot be undone.</p>
          <div className="delete-confirm-modal__actions">
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              type="submit"
              className="delete-confirm-modal__delete-button"
            >
              <Trash2 size={16} />
              <span >Delete</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

