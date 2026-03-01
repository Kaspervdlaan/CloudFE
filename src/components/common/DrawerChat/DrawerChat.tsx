import { useState, useRef, useEffect } from 'react';
import { MdPerson, MdSmartToy } from 'react-icons/md';
import { AIInput } from '../AIInput/AIInput';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { parseCodeBlocksStreaming } from '../../../utils/codeBlockParser';
import { api } from '../../../utils/api';
import type { Message } from '../../../types/ai';
import './_DrawerChat.scss';

export function DrawerChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const submitMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const baseTime = Date.now();
    const userMessageId = `user-${baseTime}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessageId = `assistant-${baseTime + 1}-${Math.random().toString(36).substr(2, 9)}`;

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    const currentMessages = messagesRef.current;
    setMessages([...currentMessages, userMessage, assistantMessage]);

    try {
      let fullResponse = '';
      await api.streamChatWithHistory(
        [...currentMessages, userMessage],
        (chunk: string) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.message !== 'Request aborted') {
        console.error('DrawerChat error:', err);
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== userMessageId && msg.id !== assistantMessageId)
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  function MessageContent({ content }: { content: string }) {
    const parsed = parseCodeBlocksStreaming(content);
    return (
      <div className="ai-chat__message-text">
        {parsed.parts.map((part, index) => {
          if (part.type === 'code' && part.codeBlock) {
            return (
              <CodeBlock
                key={index}
                code={part.codeBlock.code}
                language={part.codeBlock.language}
                filename={part.codeBlock.filename}
              />
            );
          }
          return (
            <div key={index} className="ai-chat__message-text-content">
              {part.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < part.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="drawer-chat">
      {messages.length === 0 ? (
        <div className="ai-chat__empty drawer-chat__empty">
          <div className="ai-chat__empty-icon">
            <MdSmartToy size={48} />
          </div>
          <h2 className="ai-chat__empty-title">How can I help?</h2>
          <p className="ai-chat__empty-subtitle">Ask Markov anything</p>
        </div>
      ) : (
        <div className="ai-chat__messages drawer-chat__messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-chat__message ai-chat__message--${message.role}`}
            >
              <div className="ai-chat__message-avatar">
                {message.role === 'user' ? (
                  <MdPerson size={20} />
                ) : (
                  <MdSmartToy size={20} />
                )}
              </div>
              <div className="ai-chat__message-content">
                {message.role === 'assistant' ? (
                  <MessageContent content={message.content} />
                ) : (
                  <div className="ai-chat__message-text">
                    {message.content.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="ai-chat__message ai-chat__message--assistant">
              <div className="ai-chat__message-avatar">
                <MdSmartToy size={20} />
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

      <div className="drawer-chat__input">
        <AIInput
          onSubmit={submitMessage}
          onCancel={handleCancel}
          isLoading={isLoading}
          placeholder="Ask Markov..."
          showFooter={false}
        />
      </div>
    </div>
  );
}
