"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteUserRepository = void 0;
const uuid_1 = require("uuid");
/**
 * SQLite (sql.js) implementation of UserRepository.
 * Requirements: 2.1
 */
class SqliteUserRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create() {
        const id = (0, uuid_1.v4)();
        const created_at = new Date().toISOString();
        this.db.run('INSERT INTO users (id, created_at) VALUES (:id, :created_at)', { ':id': id, ':created_at': created_at });
        return { id, created_at };
    }
    async findById(id) {
        const stmt = this.db.prepare('SELECT id, created_at FROM users WHERE id = :id');
        stmt.bind({ ':id': id });
        let result = null;
        if (stmt.step()) {
            const row = stmt.getAsObject();
            result = { id: row.id, created_at: row.created_at };
        }
        stmt.free();
        return result;
    }
}
exports.SqliteUserRepository = SqliteUserRepository;
//# sourceMappingURL=user-repository.impl.js.map