import type { Database } from 'sql.js';
import type { StoredConversation, ConversationRepository } from './conversation-repository';
/**
 * SQLite (sql.js) implementation of ConversationRepository.
 * Requirements: 2.2
 */
export declare class SqliteConversationRepository implements ConversationRepository {
    private db;
    constructor(db: Database);
    create(userId: string): Promise<StoredConversation>;
    findById(id: string): Promise<StoredConversation | null>;
    touch(id: string): Promise<void>;
}
//# sourceMappingURL=conversation-repository.impl.d.ts.map