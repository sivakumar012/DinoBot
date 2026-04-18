/**
 * Typed API client for the Multi-LLM Orchestration backend.
 * All network calls go through here — no raw fetch() elsewhere.
 *
 * Base URL is configurable via API_BASE_URL (default: localhost:3000 for dev).
 */

import { API_BASE_URL } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used: string | null;
  token_count: number | null;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface UsageSummary {
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  estimated_cost: number;
}

export interface SendMessageResponse {
  message: {
    id: string;
    role: 'assistant';
    content: string;
    model_used: string;
    created_at: string;
  };
  usage: UsageSummary;
}

export interface ApiError {
  error_code: string;
  message: string;
  provider?: string;
  model?: string;
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = 'ApiClientError';
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError: ApiError = body?.error ?? {
      error_code: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}`,
    };
    throw new ApiClientError(response.status, apiError);
  }

  return body as T;
}

// ─── API methods ──────────────────────────────────────────────────────────────

/**
 * Creates a new conversation for the given user.
 */
export async function createConversation(userId: string): Promise<Conversation> {
  return request<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

/**
 * Fetches a conversation and all its messages.
 */
export async function getConversation(
  conversationId: string,
): Promise<ConversationWithMessages> {
  return request<ConversationWithMessages>(`/conversations/${conversationId}`);
}

/**
 * Sends a user message and returns the assistant response.
 */
export async function sendMessage(params: {
  conversationId: string;
  content: string;
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(
    `/conversations/${params.conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: params.content,
        provider: params.provider,
        model: params.model,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
      }),
    },
  );
}

/**
 * Submits a flag/report for an AI-generated message.
 * Store-compliance: GenAI Safety 2026 Mandate.
 */
export async function flagMessage(params: {
  messageId: string;
  conversationId?: string;
  reason: 'harmful' | 'inaccurate' | 'inappropriate' | 'privacy' | 'other';
  details?: string;
}): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>('/moderation/flag', {
    method: 'POST',
    body: JSON.stringify({
      message_id: params.messageId,
      conversation_id: params.conversationId,
      reason: params.reason,
      details: params.details,
    }),
  });
}
