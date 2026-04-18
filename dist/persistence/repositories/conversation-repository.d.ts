/**
 * Stored representation of a Conversation record from the database.
 */
export interface StoredConversation {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}
/**
 * Repository interface for Conversation persistence operations.
 * Requirements: 2.2
 */
export interface ConversationRepository {
    create(userId: string): Promise<StoredConversation>;
    findById(id: string): Promise<StoredConversation | null>;
    /** Updates the updated_at timestamp to the current time. */
    touch(id: string): Promise<void>;
}
//# sourceMappingURL=conversation-repository.d.ts.map