import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdPerson, MdSmartToy, MdMenu, MdClose } from 'react-icons/md';
import { Layout } from '../../components/layout/Layout/Layout';
import { CodeBlock } from '../../components/common/CodeBlock/CodeBlock';
import { AIInput } from '../../components/common/AIInput/AIInput';
import { ConversationsSidebar } from '../../components/files/ConversationsSidebar/ConversationsSidebar';
import { parseCodeBlocksStreaming } from '../../utils/codeBlockParser';
import {
  getConversations,
  saveConversations,
  generateConversationTitle,
} from '../../utils/conversationStorage';
import './_AI.scss';
import { api } from '../../utils/api';
import type { Message, Conversation } from '../../types/ai';

export function AI() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasProcessedInitialPrompt = useRef(false);
  const isInitializedRef = useRef(false);
  const isSavingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      const loadedConversations = getConversations();
      setConversations(loadedConversations);
      
      // Select the most recent conversation if available
      if (loadedConversations.length > 0) {
        const mostRecent = loadedConversations[0];
        setCurrentConversationId(mostRecent.id);
        setMessages(mostRecent.messages);
      }
      
      isInitializedRef.current = true;
    }
  }, []);

  // Keep conversations in a ref to access latest value without dependency
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Keep messages in a ref to access latest value
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages when conversation changes (but skip if we're submitting)
  const isSubmittingRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current || isSubmittingRef.current) return;
    
    if (currentConversationId) {
      // Use ref to get latest conversations without creating dependency
      const conversation = conversationsRef.current.find(c => c.id === currentConversationId);
      if (conversation) {
        isSavingRef.current = true;
        setMessages(conversation.messages);
        // Reset flag after messages are set
        setTimeout(() => {
          isSavingRef.current = false;
        }, 50);
      }
    } else {
      setMessages([]);
    }
    // Only depend on currentConversationId, not conversations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]);

  // Save conversation whenever messages change (but only if we're not loading from storage)
  useEffect(() => {
    if (!isInitializedRef.current || !currentConversationId || messages.length === 0 || isSavingRef.current) return;

    setConversations(prev => {
      const conversation = prev.find(c => c.id === currentConversationId);
      if (!conversation) return prev;

      // Check if messages actually changed by comparing IDs and content
      const currentMessageIds = conversation.messages.map(m => m.id).join(',');
      const newMessageIds = messages.map(m => m.id).join(',');
      
      // If IDs are different, messages definitely changed
      if (currentMessageIds !== newMessageIds) {
        const updatedConversation: Conversation = {
          ...conversation,
          messages,
          updatedAt: new Date().toISOString(),
        };
        const updated = prev.map(c => c.id === currentConversationId ? updatedConversation : c);
        const sorted = updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        saveConversations(sorted);
        return sorted;
      }

      // If IDs are the same, check if content changed (e.g., during streaming)
      const messagesChanged = conversation.messages.length !== messages.length ||
        conversation.messages.some((msg, idx) => {
          const newMsg = messages[idx];
          return !newMsg || msg.id !== newMsg.id || msg.content !== newMsg.content;
        });

      if (!messagesChanged) {
        // Messages haven't changed, don't save
        return prev;
      }

      const updatedConversation: Conversation = {
        ...conversation,
        messages,
        updatedAt: new Date().toISOString(),
      };

      // Update in state first
      const updated = prev.map(c => c.id === currentConversationId ? updatedConversation : c);
      // Sort by updatedAt (newest first)
      const sorted = updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      // Save to localStorage using the updated array
      saveConversations(sorted);
      
      return sorted;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentConversationId]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const createNewConversation = (): string => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setConversations(prev => {
      const updated = [newConversation, ...prev];
      saveConversations(updated);
      return updated;
    });
    
    // Set conversation ID but don't set messages here - let submitMessage handle it
    setCurrentConversationId(newId);
    
    return newId;
  };

  const submitMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    // Prevent conversation loading effect from interfering
    isSubmittingRef.current = true;

    // Create new conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createNewConversation();
      // When creating a new conversation, ensure messages are empty
      setMessages([]);
    }

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

    // Get current messages from ref to avoid stale state
    const currentMessages = messagesRef.current;
    
    // Add both messages at once
    const updatedMessages = [...currentMessages, userMessage, assistantMessage];
    setMessages(updatedMessages);

    // Update conversation title if this is the first message
    if (currentMessages.length === 0) {
      const title = generateConversationTitle(messageContent.trim());
      setConversations(prev => {
        const conversation = prev.find(c => c.id === conversationId);
        if (!conversation) return prev;
        
        const updatedConversation: Conversation = {
          ...conversation,
          title,
        };
        const updated = prev.map(c => c.id === conversationId ? updatedConversation : c);
        saveConversations(updated);
        return updated;
      });
    }

    try {
      let fullResponse = '';
      
      // Only send messages up to the user message (not the empty assistant placeholder)
      const messagesToSend = [...currentMessages, userMessage];
      
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
      isSubmittingRef.current = false;
    }
  };

  const handleInputSubmit = async (messageContent: string) => {
    await submitMessage(messageContent);
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Close sidebar on mobile when conversation is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId);
      saveConversations(filtered);
      
      if (currentConversationId === conversationId) {
        if (filtered.length > 0) {
          setCurrentConversationId(filtered[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
      
      return filtered;
    });
  };

  const handleNewConversation = () => {
    createNewConversation();
  };

  // Handle initial prompt from URL params
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !hasProcessedInitialPrompt.current && isInitializedRef.current && !isLoading) {
      hasProcessedInitialPrompt.current = true;
      const decodedPrompt = decodeURIComponent(prompt);
      // Clear the prompt from URL
      setSearchParams({}, { replace: true });
      // Submit the prompt (will create new conversation if needed)
      submitMessage(decodedPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading, isInitializedRef.current]);


  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      onSearch={() => {}}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showSearch={false}
      showViewToggle={false}
      showSidebar={false}
    >
      <div className="ai-chat">
        {isSidebarOpen && (
          <div 
            className="ai-chat__sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <ConversationsSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <button
          className="ai-chat__sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
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

