"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const cost_rates_1 = require("../persistence/cost-rates");
const logger_1 = require("../utils/logger");
/**
 * Core 7-step request pipeline.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
class Orchestrator {
    registry;
    contextEngine;
    hookSystem;
    db;
    costRates;
    constructor(registry, contextEngine, hookSystem, db, costRates) {
        this.registry = registry;
        this.contextEngine = contextEngine;
        this.hookSystem = hookSystem;
        this.db = db;
        this.costRates = costRates;
    }
    async process(req) {
        // Step 1: Load conversation history
        const history = await this.db.messages.findByConversationId(req.conversation_id);
        const historyMessages = history.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        // Append the new user message to history for context building
        const fullHistory = [
            ...historyMessages,
            { role: 'user', content: req.content },
        ];
        // Step 2: Dispatch beforeRequest hooks
        await this.hookSystem.dispatch('beforeRequest', {
            conversation_id: req.conversation_id,
            provider: req.provider,
            model: req.model,
            messages: fullHistory,
        });
        // Step 3: Invoke Context Engine
        const { messages: contextMessages } = this.contextEngine.buildContext(fullHistory, req.model);
        // Step 4: Call Provider Adapter
        const provider = this.registry.resolve(req.provider);
        const llmResponse = await provider.generateResponse({
            model: req.model,
            messages: contextMessages,
            temperature: req.temperature,
            max_tokens: req.max_tokens,
        });
        const estimatedCost = (0, cost_rates_1.calculateCost)(this.costRates, req.provider, req.model, llmResponse.tokens_in, llmResponse.tokens_out);
        const usageData = {
            provider: req.provider,
            model: req.model,
            tokens_in: llmResponse.tokens_in,
            tokens_out: llmResponse.tokens_out,
            latency_ms: llmResponse.latency_ms,
            estimated_cost: estimatedCost,
            error_status: llmResponse.error?.error_code ?? null,
        };
        // Step 5: Dispatch afterResponse hooks
        await this.hookSystem.dispatch('afterResponse', {
            response: llmResponse,
            usage: usageData,
        });
        // Step 6: Persist Message + UsageLog (same logical operation)
        if (llmResponse.error) {
            // On provider error: dispatch onError hooks, persist error UsageLog, return structured error
            await this.hookSystem.dispatch('onError', {
                error: llmResponse.error,
                conversation_id: req.conversation_id,
                provider: req.provider,
                model: req.model,
            });
            // Persist error UsageLog (no message saved for failed requests)
            try {
                await this.db.usageLogs.save({
                    conversation_id: req.conversation_id,
                    message_id: null,
                    ...usageData,
                });
            }
            catch (dbErr) {
                logger_1.logger.error({ err: dbErr }, 'Failed to persist error UsageLog');
                await this.hookSystem.dispatch('onError', {
                    error: dbErr instanceof Error ? dbErr : new Error(String(dbErr)),
                    conversation_id: req.conversation_id,
                });
            }
            // Return a placeholder message with error info
            return {
                message: {
                    id: '',
                    role: 'assistant',
                    content: '',
                    model_used: req.model,
                    created_at: new Date().toISOString(),
                },
                usage: usageData,
                error: {
                    error_code: llmResponse.error.error_code,
                    message: llmResponse.error.message,
                    provider: req.provider,
                    model: req.model,
                },
            };
        }
        // Save user message first
        let savedUserMessage;
        let savedAssistantMessage;
        let savedUsageLog;
        try {
            savedUserMessage = await this.db.messages.save({
                conversation_id: req.conversation_id,
                role: 'user',
                content: req.content,
                model_used: null,
                token_count: null,
            });
            savedAssistantMessage = await this.db.messages.save({
                conversation_id: req.conversation_id,
                role: 'assistant',
                content: llmResponse.content,
                model_used: req.model,
                token_count: llmResponse.tokens_out,
            });
            savedUsageLog = await this.db.usageLogs.save({
                conversation_id: req.conversation_id,
                message_id: savedAssistantMessage.id,
                ...usageData,
            });
            // Touch conversation updated_at
            await this.db.conversations.touch(req.conversation_id);
        }
        catch (dbErr) {
            logger_1.logger.error({ err: dbErr }, 'Failed to persist message or UsageLog');
            await this.hookSystem.dispatch('onError', {
                error: dbErr instanceof Error ? dbErr : new Error(String(dbErr)),
                conversation_id: req.conversation_id,
            });
            // Still try to persist a UsageLog with error status if we haven't yet
            if (!savedUsageLog) {
                try {
                    await this.db.usageLogs.save({
                        conversation_id: req.conversation_id,
                        message_id: savedAssistantMessage?.id ?? null,
                        ...usageData,
                        error_status: 'DATABASE_ERROR',
                    });
                }
                catch {
                    // Best-effort — log already emitted above
                }
            }
            throw dbErr;
        }
        // Step 7: Return OrchestratorResult
        return {
            message: {
                id: savedAssistantMessage.id,
                role: 'assistant',
                content: llmResponse.content,
                model_used: req.model,
                created_at: savedAssistantMessage.created_at,
            },
            usage: usageData,
        };
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=orchestrator.js.map