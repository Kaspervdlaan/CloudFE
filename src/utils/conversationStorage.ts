import type { Conversation } from '../types/ai';

const STORAGE_KEY = 'ai-conversations';

/**
 * Serialize messages for localStorage (Date objects to strings)
 */
function serializeConversation(conversation: Conversation): string {
  const serialized = {
    ...conversation,
    messages: conversation.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    })),
  };
  return JSON.stringify(serialized);
}

/**
 * Get all conversations from localStorage
 */
export function getConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((conv: any) => ({
      ...conv,
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Error loading conversations from localStorage:', error);
    return [];
  }
}

/**
 * Save all conversations to localStorage
 */
export function saveConversations(conversations: Conversation[]): void {
  try {
    const serialized = conversations.map(serializeConversation).map(json => JSON.parse(json));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Error saving conversations to localStorage:', error);
  }
}

/**
 * Save a single conversation (updates or creates)
 * Uses the provided conversations array to avoid stale data issues
 */
export function saveConversationInList(conversation: Conversation, existingConversations: Conversation[]): Conversation[] {
  const index = existingConversations.findIndex(c => c.id === conversation.id);
  
  let updated: Conversation[];
  if (index >= 0) {
    // Update existing conversation
    updated = existingConversations.map(c => c.id === conversation.id ? conversation : c);
  } else {
    // Add new conversation
    updated = [...existingConversations, conversation];
  }
  
  // Sort by updatedAt (newest first)
  updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  return updated;
}

/**
 * Save a single conversation (updates or creates)
 * @deprecated Use saveConversationInList instead to avoid stale data issues
 */
export function saveConversation(conversation: Conversation): void {
  const conversations = getConversations();
  const updated = saveConversationInList(conversation, conversations);
  saveConversations(updated);
}

/**
 * Delete a conversation by ID
 */
export function deleteConversation(conversationId: string): void {
  const conversations = getConversations();
  const filtered = conversations.filter(c => c.id !== conversationId);
  saveConversations(filtered);
}

/**
 * Get a conversation by ID
 */
export function getConversation(conversationId: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === conversationId) || null;
}

/**
 * Generate a title from the first user message
 */
export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  const trimmed = firstMessage.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
}

