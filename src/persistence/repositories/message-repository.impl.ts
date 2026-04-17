import type { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import type { StoredMessage, NewMessage, MessageRepository } from './message-repository';

/**
 * SQLite (sql.js) implementation of MessageRepository.
 * Requirements: 2.3
 */
export class SqliteMessageRepository implements MessageRepository {
  constructor(private db: Database) {}

  async save(message: NewMessage): Promise<StoredMessage> {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(
      `INSERT INTO messages (id, conversation_id, role, content, model_used, token_count, created_at)
       VALUES (:id, :conversation_id, :role, :content, :model_used, :token_count, :created_at)`,
      {
        ':id': id,
        ':conversation_id': message.conversation_id,
        ':role': message.role,
        ':content': message.content,
        ':model_used': message.model_used ?? null,
        ':token_count': message.token_count ?? null,
        ':created_at': created_at,
      }
    );

    return { ...message, id, created_at };
  }

  async findByConversationId(conversationId: string): Promise<StoredMessage[]> {
    const stmt = this.db.prepare(
      `SELECT id, conversation_id, role, content, model_used, token_count, created_at
       FROM messages
       WHERE conversation_id = :conversation_id
       ORDER BY created_at ASC`
    );
    stmt.bind({ ':conversation_id': conversationId });

    const results: StoredMessage[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as {
        id: string;
        conversation_id: string;
        role: string;
        content: string;
        model_used: string | null;
        token_count: number | null;
        created_at: string;
      };
      results.push({
        id: row.id,
        conversation_id: row.conversation_id,
        role: row.role as 'system' | 'user' | 'assistant',
        content: row.content,
        model_used: row.model_used,
        token_count: row.token_count,
        created_at: row.created_at,
      });
    }

    stmt.free();
    return results;
  }
}
