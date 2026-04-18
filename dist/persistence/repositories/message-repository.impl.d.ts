import type { Database } from 'sql.js';
import type { StoredMessage, NewMessage, MessageRepository } from './message-repository';
/**
 * SQLite (sql.js) implementation of MessageRepository.
 * Requirements: 2.3
 */
export declare class SqliteMessageRepository implements MessageRepository {
    private db;
    constructor(db: Database);
    save(message: NewMessage): Promise<StoredMessage>;
    findByConversationId(conversationId: string): Promise<StoredMessage[]>;
}
//# sourceMappingURL=message-repository.impl.d.ts.map