import type { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import type { StoredUsageLog, NewUsageLog, UsageLogRepository } from './usage-log-repository';

/**
 * SQLite (sql.js) implementation of UsageLogRepository.
 * Requirements: 2.4
 */
export class SqliteUsageLogRepository implements UsageLogRepository {
  constructor(private db: Database) {}

  async save(log: NewUsageLog): Promise<StoredUsageLog> {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(
      `INSERT INTO usage_logs
         (id, conversation_id, message_id, provider, model, tokens_in, tokens_out,
          latency_ms, estimated_cost, error_status, created_at)
       VALUES
         (:id, :conversation_id, :message_id, :provider, :model, :tokens_in, :tokens_out,
          :latency_ms, :estimated_cost, :error_status, :created_at)`,
      {
        ':id': id,
        ':conversation_id': log.conversation_id,
        ':message_id': log.message_id ?? null,
        ':provider': log.provider,
        ':model': log.model,
        ':tokens_in': log.tokens_in,
        ':tokens_out': log.tokens_out,
        ':latency_ms': log.latency_ms,
        ':estimated_cost': log.estimated_cost,
        ':error_status': log.error_status ?? null,
        ':created_at': created_at,
      }
    );

    return { ...log, id, created_at };
  }

  async findByConversationId(conversationId: string): Promise<StoredUsageLog[]> {
    const stmt = this.db.prepare(
      `SELECT id, conversation_id, message_id, provider, model, tokens_in, tokens_out,
              latency_ms, estimated_cost, error_status, created_at
       FROM usage_logs
       WHERE conversation_id = :conversation_id
       ORDER BY created_at ASC`
    );
    stmt.bind({ ':conversation_id': conversationId });

    const results: StoredUsageLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as {
        id: string;
        conversation_id: string;
        message_id: string | null;
        provider: string;
        model: string;
        tokens_in: number;
        tokens_out: number;
        latency_ms: number;
        estimated_cost: number;
        error_status: string | null;
        created_at: string;
      };
      results.push({
        id: row.id,
        conversation_id: row.conversation_id,
        message_id: row.message_id,
        provider: row.provider,
        model: row.model,
        tokens_in: row.tokens_in,
        tokens_out: row.tokens_out,
        latency_ms: row.latency_ms,
        estimated_cost: row.estimated_cost,
        error_status: row.error_status,
        created_at: row.created_at,
      });
    }

    stmt.free();
    return results;
  }
}
