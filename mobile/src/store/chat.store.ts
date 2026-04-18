/**
 * Chat store — manages conversations and messages in memory.
 * Conversations are loaded from the backend on demand.
 */
import { create } from 'zustand';
import type { Conversation, Message, UsageSummary } from '../api/client';

export interface LocalMessage extends Message {
  // Optimistic UI: message is pending a response
  isPending?: boolean;
  // Usage data attached to assistant messages
  usage?: UsageSummary;
  // Error state for failed sends
  error?: string;
}

export interface LocalConversation extends Conversation {
  messages: LocalMessage[];
  // Preview text for the conversation list
  preview: string;
}

interface ChatState {
  conversations: LocalConversation[];
  activeConversationId: string | null;

  // Actions
  addConversation: (conv: Conversation) => void;
  setActiveConversation: (id: string) => void;
  setMessages: (conversationId: string, messages: LocalMessage[]) => void;
  addOptimisticMessage: (conversationId: string, message: LocalMessage) => void;
  resolveMessage: (
    conversationId: string,
    tempId: string,
    assistantMessage: LocalMessage,
    userMessage: LocalMessage,
  ) => void;
  markMessageError: (conversationId: string, tempId: string, error: string) => void;
  removeConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,

  addConversation: (conv) =>
    set((state) => ({
      conversations: [
        { ...conv, messages: [], preview: 'New conversation' },
        ...state.conversations,
      ],
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages,
              preview: getPreview(messages),
            }
          : c,
      ),
    })),

  addOptimisticMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message] }
          : c,
      ),
    })),

  resolveMessage: (conversationId, tempId, assistantMessage, userMessage) =>
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        // Replace the optimistic user message + append assistant response
        const messages = c.messages
          .map((m) => (m.id === tempId ? { ...userMessage } : m))
          .concat(assistantMessage);
        return { ...c, messages, preview: getPreview(messages) };
      }),
    })),

  markMessageError: (conversationId, tempId, error) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === tempId ? { ...m, isPending: false, error } : m,
              ),
            }
          : c,
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPreview(messages: LocalMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role !== 'system');
  if (!last) return 'New conversation';
  return last.content.slice(0, 80) + (last.content.length > 80 ? '…' : '');
}
