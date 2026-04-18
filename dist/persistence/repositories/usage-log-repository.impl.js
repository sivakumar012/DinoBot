"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteUsageLogRepository = void 0;
const uuid_1 = require("uuid");
/**
 * SQLite (sql.js) implementation of UsageLogRepository.
 * Requirements: 2.4
 */
class SqliteUsageLogRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async save(log) {
        const id = (0, uuid_1.v4)();
        const created_at = new Date().toISOString();
        this.db.run(`INSERT INTO usage_logs
         (id, conversation_id, message_id, provider, model, tokens_in, tokens_out,
          latency_ms, estimated_cost, error_status, created_at)
       VALUES
         (:id, :conversation_id, :message_id, :provider, :model, :tokens_in, :tokens_out,
          :latency_ms, :estimated_cost, :error_status, :created_at)`, {
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
        });
        return { ...log, id, created_at };
    }
    async findByConversationId(conversationId) {
        const stmt = this.db.prepare(`SELECT id, conversation_id, message_id, provider, model, tokens_in, tokens_out,
              latency_ms, estimated_cost, error_status, created_at
       FROM usage_logs
       WHERE conversation_id = :conversation_id
       ORDER BY created_at ASC`);
        stmt.bind({ ':conversation_id': conversationId });
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
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
exports.SqliteUsageLogRepository = SqliteUsageLogRepository;
//# sourceMappingURL=usage-log-repository.impl.js.map