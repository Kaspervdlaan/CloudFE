import { useState, useRef, useEffect } from 'react';
import { MdSend, MdPerson } from 'react-icons/md';
import { Layout } from '../../components/layout/Layout/Layout';
import './_AI.scss';
import { api } from '../../utils/api';
import type { Message } from '../../types/ai';

export function AI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = Date.now().toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      let fullResponse = '';
      
      await api.streamChatWithHistory(updatedMessages, (chunk: string) => {
        fullResponse += chunk;
        // Update the assistant message with accumulated content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      });
    } catch (err) {
      console.error('AI chat error:', err);
      // Remove both user and assistant messages on error so they can retry
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  console.log('searchQuery', searchQuery);

  return (
    <Layout
      onSearch={setSearchQuery}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showSearch={false}
      showViewToggle={false}
      showSidebar={false}
    >
      <div className="ai-chat">
        <div className="ai-chat__container">
          {messages.length === 0 ? (
            <div className="ai-chat__empty">
              <div className="ai-chat__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="ai-chat__empty-title">How can I help you today?</h2>
              <p className="ai-chat__empty-subtitle">Start a conversation with AI</p>
            </div>
          ) : (
            <div className="ai-chat__messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-chat__message ai-chat__message--${message.role}`}
                >
                  <div className="ai-chat__message-avatar">
                    {message.role === 'user' ? (
                      <MdPerson size={20} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    )}
                  </div>
                  <div className="ai-chat__message-content">
                    <div className="ai-chat__message-text">
                      {message.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-chat__message ai-chat__message--assistant">
                  <div className="ai-chat__message-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="ai-chat__message-content">
                    <div className="ai-chat__typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <form className="ai-chat__input-container" onSubmit={handleSubmit}>
            <div className="ai-chat__input-wrapper">
              <textarea
                ref={inputRef}
                className="ai-chat__input"
                value={input}
                autoFocus
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message AI..."
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="ai-chat__send-button"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <MdSend size={20} />
              </button>
            </div>
            <div className="ai-chat__input-footer">
              <p className="ai-chat__input-hint">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

