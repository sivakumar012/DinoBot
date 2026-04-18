import type { Database } from 'sql.js';
import type { StoredUsageLog, NewUsageLog, UsageLogRepository } from './usage-log-repository';
/**
 * SQLite (sql.js) implementation of UsageLogRepository.
 * Requirements: 2.4
 */
export declare class SqliteUsageLogRepository implements UsageLogRepository {
    private db;
    constructor(db: Database);
    save(log: NewUsageLog): Promise<StoredUsageLog>;
    findByConversationId(conversationId: string): Promise<StoredUsageLog[]>;
}
//# sourceMappingURL=usage-log-repository.impl.d.ts.map