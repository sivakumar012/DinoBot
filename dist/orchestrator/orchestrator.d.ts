import type { ProviderRegistry } from '../providers/registry';
import type { ContextEngine } from '../context-engine/context-engine';
import type { HookSystem } from '../hooks/hook-system';
import type { ConversationRepository } from '../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../persistence/repositories/message-repository';
import type { UsageLogRepository } from '../persistence/repositories/usage-log-repository';
import type { CostRateTable } from '../persistence/cost-rates';
import type { UsageLogData } from '../types/hook';
export interface OrchestratorRequest {
    conversation_id: string;
    content: string;
    provider: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
}
export interface OrchestratorResult {
    message: {
        id: string;
        role: 'assistant';
        content: string;
        model_used: string;
        created_at: string;
    };
    usage: UsageLogData;
    error?: {
        error_code: string;
        message: string;
        provider: string;
        model: string;
    };
}
interface OrchestratorDeps {
    conversations: ConversationRepository;
    messages: MessageRepository;
    usageLogs: UsageLogRepository;
}
/**
 * Core 7-step request pipeline.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export declare class Orchestrator {
    private registry;
    private contextEngine;
    private hookSystem;
    private db;
    private costRates;
    constructor(registry: ProviderRegistry, contextEngine: ContextEngine, hookSystem: HookSystem, db: OrchestratorDeps, costRates: CostRateTable);
    process(req: OrchestratorRequest): Promise<OrchestratorResult>;
}
export {};
//# sourceMappingURL=orchestrator.d.ts.map