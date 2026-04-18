"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteMessageRepository = void 0;
const uuid_1 = require("uuid");
/**
 * SQLite (sql.js) implementation of MessageRepository.
 * Requirements: 2.3
 */
class SqliteMessageRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async save(message) {
        const id = (0, uuid_1.v4)();
        const created_at = new Date().toISOString();
        this.db.run(`INSERT INTO messages (id, conversation_id, role, content, model_used, token_count, created_at)
       VALUES (:id, :conversation_id, :role, :content, :model_used, :token_count, :created_at)`, {
            ':id': id,
            ':conversation_id': message.conversation_id,
            ':role': message.role,
            ':content': message.content,
            ':model_used': message.model_used ?? null,
            ':token_count': message.token_count ?? null,
            ':created_at': created_at,
        });
        return { ...message, id, created_at };
    }
    async findByConversationId(conversationId) {
        const stmt = this.db.prepare(`SELECT id, conversation_id, role, content, model_used, token_count, created_at
       FROM messages
       WHERE conversation_id = :conversation_id
       ORDER BY created_at ASC`);
        stmt.bind({ ':conversation_id': conversationId });
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push({
                id: row.id,
                conversation_id: row.conversation_id,
                role: row.role,
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
exports.SqliteMessageRepository = SqliteMessageRepository;
//# sourceMappingURL=message-repository.impl.js.map