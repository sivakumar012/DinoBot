"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicAdapter = void 0;
/**
 * Anthropic Messages API adapter implementing the Provider interface.
 * Requirements: 3.5, 3.6, 3.7, 3.8, 3.9
 */
class AnthropicAdapter {
    client;
    constructor(client) {
        this.client = client;
    }
    async generateResponse(params) {
        const start = Date.now();
        // Anthropic separates system messages from the conversation messages array
        const systemMsg = params.messages.find((m) => m.role === 'system');
        const conversationMsgs = params.messages.filter((m) => m.role !== 'system');
        try {
            const requestParams = {
                model: params.model,
                messages: conversationMsgs.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                max_tokens: params.max_tokens ?? 1024,
                ...(systemMsg && { system: systemMsg.content }),
                ...(params.temperature !== undefined && { temperature: params.temperature }),
            };
            const response = await this.client.messages.create(requestParams);
            const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
            return {
                content,
                tokens_in: response.usage.input_tokens,
                tokens_out: response.usage.output_tokens,
                latency_ms: Date.now() - start,
                model: params.model,
            };
        }
        catch (err) {
            return {
                content: '',
                tokens_in: 0,
                tokens_out: 0,
                latency_ms: Date.now() - start,
                model: params.model,
                error: {
                    error_code: 'ANTHROPIC_ERROR',
                    message: err instanceof Error ? err.message : String(err),
                },
            };
        }
    }
}
exports.AnthropicAdapter = AnthropicAdapter;
//# sourceMappingURL=anthropic-adapter.js.map