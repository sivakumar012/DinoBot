/**
 * Stored representation of a UsageLog record from the database.
 */
export interface StoredUsageLog {
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
}
/**
 * Input type for creating a new UsageLog (excludes auto-generated fields).
 */
export type NewUsageLog = Omit<StoredUsageLog, 'id' | 'created_at'>;
/**
 * Repository interface for UsageLog persistence operations.
 * Requirements: 2.4
 */
export interface UsageLogRepository {
    save(log: NewUsageLog): Promise<StoredUsageLog>;
    findByConversationId(conversationId: string): Promise<StoredUsageLog[]>;
}
//# sourceMappingURL=usage-log-repository.d.ts.map