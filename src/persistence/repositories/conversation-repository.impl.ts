import type { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import type { StoredConversation, ConversationRepository } from './conversation-repository';

/**
 * SQLite (sql.js) implementation of ConversationRepository.
 * Requirements: 2.2
 */
export class SqliteConversationRepository implements ConversationRepository {
  constructor(private db: Database) {}

  async create(userId: string): Promise<StoredConversation> {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      'INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES (:id, :user_id, :created_at, :updated_at)',
      { ':id': id, ':user_id': userId, ':created_at': now, ':updated_at': now }
    );

    return { id, user_id: userId, created_at: now, updated_at: now };
  }

  async findById(id: string): Promise<StoredConversation | null> {
    const stmt = this.db.prepare(
      'SELECT id, user_id, created_at, updated_at FROM conversations WHERE id = :id'
    );
    stmt.bind({ ':id': id });

    let result: StoredConversation | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as {
        id: string;
        user_id: string;
        created_at: string;
        updated_at: string;
      };
      result = {
        id: row.id,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }

    stmt.free();
    return result;
  }

  async touch(id: string): Promise<void> {
    const updated_at = new Date().toISOString();
    this.db.run(
      'UPDATE conversations SET updated_at = :updated_at WHERE id = :id',
      { ':updated_at': updated_at, ':id': id }
    );
  }
}
