import { useState, useRef } from 'react';
import { MdSend, MdClose } from 'react-icons/md';
import './_AIInput.scss';

interface AIInputProps {
  onSubmit: (message: string) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showFooter?: boolean;
  autoFocus?: boolean;
}

export function AIInput({
  onSubmit,
  onCancel,
  isLoading = false,
  placeholder = 'Ask Markov...',
  disabled = false,
  className = '',
  showFooter = true,
  autoFocus = false,
}: AIInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const messageContent = input.trim();
    setInput('');
    await onSubmit(messageContent);
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form className={`ai-input ${className}`} onSubmit={handleSubmit}>
      <div className="ai-input__wrapper">
        <textarea
          ref={inputRef}
          className="ai-input__textarea"
          value={input}
          autoFocus={autoFocus}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading || disabled}
        />
        {isLoading && onCancel ? (
          <button
            type="button"
            className="ai-input__cancel-button"
            onClick={handleCancel}
            aria-label="Cancel"
            title="Cancel response"
          >
            <MdClose size={20} />
          </button>
        ) : (
          <button
            type="submit"
            className="ai-input__send-button"
            disabled={!input.trim() || isLoading || disabled}
            aria-label="Send message"
          >
            <MdSend size={20} />
          </button>
        )}
      </div>
      {showFooter && (
        <div className="ai-input__footer">
          <p className="ai-input__hint">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </form>
  );
}

