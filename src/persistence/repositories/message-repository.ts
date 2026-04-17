/**
 * Stored representation of a Message record from the database.
 */
export interface StoredMessage {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  model_used: string | null;
  token_count: number | null;
  created_at: string;
}

/**
 * Input type for creating a new Message (excludes auto-generated fields).
 */
export type NewMessage = Omit<StoredMessage, 'id' | 'created_at'>;

/**
 * Repository interface for Message persistence operations.
 * Requirements: 2.3
 */
export interface MessageRepository {
  findByConversationId(conversationId: string): Promise<StoredMessage[]>;
  save(message: NewMessage): Promise<StoredMessage>;
}
