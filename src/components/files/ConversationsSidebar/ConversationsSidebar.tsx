import { MdDelete, MdAdd, MdMessage, MdClose } from 'react-icons/md';
import './_ConversationsSidebar.scss';
import type { Conversation } from '../../../types/ai';

interface ConversationsSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ConversationsSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isOpen = true,
  onClose,
}: ConversationsSidebarProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(conversationId);
    }
  };

  return (
    <div className={`conversations-sidebar ${isOpen ? 'conversations-sidebar--open' : 'conversations-sidebar--closed'}`}>
      <div className="conversations-sidebar__header">
        <h3 className="conversations-sidebar__title">Conversations</h3>
        <div className="conversations-sidebar__header-actions">
          <button
            className="conversations-sidebar__new-button"
            onClick={onNewConversation}
            title="New conversation"
            aria-label="New conversation"
          >
            <MdAdd size={20} />
          </button>
          {onClose && (
            <button
              className="conversations-sidebar__close-button"
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <MdClose size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="conversations-sidebar__list">
        {conversations.length === 0 ? (
          <div className="conversations-sidebar__empty">
            <MdMessage size={32} />
            <p>No conversations yet</p>
            <button
              className="conversations-sidebar__empty-button"
              onClick={onNewConversation}
            >
              Start a conversation
            </button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversations-sidebar__item ${
                currentConversationId === conversation.id
                  ? 'conversations-sidebar__item--active'
                  : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversations-sidebar__item-content">
                <div className="conversations-sidebar__item-title">
                  {conversation.title}
                </div>
                <div className="conversations-sidebar__item-meta">
                  <span>{conversation.messages.length} messages</span>
                  <span>•</span>
                  <span>{formatDate(conversation.updatedAt)}</span>
                </div>
              </div>
              <button
                className="conversations-sidebar__item-delete"
                onClick={(e) => handleDelete(e, conversation.id)}
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

