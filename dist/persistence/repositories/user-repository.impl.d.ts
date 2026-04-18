import type { Database } from 'sql.js';
import type { StoredUser, UserRepository } from './user-repository';
/**
 * SQLite (sql.js) implementation of UserRepository.
 * Requirements: 2.1
 */
export declare class SqliteUserRepository implements UserRepository {
    private db;
    constructor(db: Database);
    create(): Promise<StoredUser>;
    findById(id: string): Promise<StoredUser | null>;
}
//# sourceMappingURL=user-repository.impl.d.ts.map