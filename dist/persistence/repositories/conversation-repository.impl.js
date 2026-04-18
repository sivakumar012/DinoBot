"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteConversationRepository = void 0;
const uuid_1 = require("uuid");
/**
 * SQLite (sql.js) implementation of ConversationRepository.
 * Requirements: 2.2
 */
class SqliteConversationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(userId) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        this.db.run('INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES (:id, :user_id, :created_at, :updated_at)', { ':id': id, ':user_id': userId, ':created_at': now, ':updated_at': now });
        return { id, user_id: userId, created_at: now, updated_at: now };
    }
    async findById(id) {
        const stmt = this.db.prepare('SELECT id, user_id, created_at, updated_at FROM conversations WHERE id = :id');
        stmt.bind({ ':id': id });
        let result = null;
        if (stmt.step()) {
            const row = stmt.getAsObject();
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
    async touch(id) {
        const updated_at = new Date().toISOString();
        this.db.run('UPDATE conversations SET updated_at = :updated_at WHERE id = :id', { ':updated_at': updated_at, ':id': id });
    }
}
exports.SqliteConversationRepository = SqliteConversationRepository;
//# sourceMappingURL=conversation-repository.impl.js.map