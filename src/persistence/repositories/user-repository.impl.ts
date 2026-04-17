import type { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import type { StoredUser, UserRepository } from './user-repository';

/**
 * SQLite (sql.js) implementation of UserRepository.
 * Requirements: 2.1
 */
export class SqliteUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async create(): Promise<StoredUser> {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(
      'INSERT INTO users (id, created_at) VALUES (:id, :created_at)',
      { ':id': id, ':created_at': created_at }
    );

    return { id, created_at };
  }

  async findById(id: string): Promise<StoredUser | null> {
    const stmt = this.db.prepare('SELECT id, created_at FROM users WHERE id = :id');
    stmt.bind({ ':id': id });

    let result: StoredUser | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as { id: string; created_at: string };
      result = { id: row.id, created_at: row.created_at };
    }

    stmt.free();
    return result;
  }
}
