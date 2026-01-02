import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdPerson, MdSmartToy } from 'react-icons/md';
import { Layout } from '../../components/layout/Layout/Layout';
import { CodeBlock } from '../../components/common/CodeBlock/CodeBlock';
import { AIInput } from '../../components/common/AIInput/AIInput';
import { parseCodeBlocksStreaming } from '../../utils/codeBlockParser';
import './_AI.scss';
import { api } from '../../utils/api';
import type { Message } from '../../types/ai';

export function AI() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasProcessedInitialPrompt = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Generate unique IDs to prevent collisions
    const baseTime = Date.now();
    const userMessageId = `user-${baseTime}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessageId = `assistant-${baseTime + 1}-${Math.random().toString(36).substr(2, 9)}`;

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    // Create assistant message placeholder for streaming
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Add both messages at once
    const updatedMessages = [...messages, userMessage, assistantMessage];
    setMessages(updatedMessages);

    try {
      let fullResponse = '';
      
      // Only send messages up to the user message (not the empty assistant placeholder)
      const messagesToSend = [...messages, userMessage];
      
      await api.streamChatWithHistory(
        messagesToSend,
        (chunk: string) => {
          fullResponse += chunk;
          // Update ONLY the assistant message - check both ID and role to be safe
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId && msg.role === 'assistant'
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        abortController.signal
      );
    } catch (err: any) {
      // Don't show error if it was aborted by user
      if (err.name === 'AbortError' || err.message === 'Request aborted') {
        // Keep the partial response, just stop loading
        console.log('Request cancelled by user');
      } else {
        console.error('AI chat error:', err);
        // Remove both user and assistant messages on error so they can retry
        setMessages((prev) => prev.filter(msg => msg.id !== userMessageId && msg.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputSubmit = async (messageContent: string) => {
    await submitMessage(messageContent);
  };

  // Handle initial prompt from URL params
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !hasProcessedInitialPrompt.current && !isLoading && messages.length === 0) {
      hasProcessedInitialPrompt.current = true;
      const decodedPrompt = decodeURIComponent(prompt);
      // Clear the prompt from URL
      setSearchParams({}, { replace: true });
      // Submit the prompt
      submitMessage(decodedPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading, messages.length]);


  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  console.log('searchQuery', searchQuery);

  // Component to render message content with code blocks
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
                <MdSmartToy size={64} />
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
                      <MdPerson size={24} />
                    ) : (
                      <MdSmartToy size={24} />
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
              {isLoading && (
                <div className="ai-chat__message ai-chat__message--assistant">
                  <div className="ai-chat__message-avatar">
                    <MdSmartToy size={24} />
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

          <AIInput
            onSubmit={handleInputSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            placeholder="Ask Markov..."
            autoFocus
          />
        </div>
      </div>
    </Layout>
  );
}

