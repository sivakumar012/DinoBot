"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
/**
 * OpenAI Chat Completions adapter implementing the Provider interface.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.9
 */
class OpenAIAdapter {
    client;
    constructor(client) {
        this.client = client;
    }
    async generateResponse(params) {
        const start = Date.now();
        try {
            const response = await this.client.chat.completions.create({
                model: params.model,
                // UnifiedMessage shape is compatible with OpenAI's message format
                messages: params.messages,
                ...(params.temperature !== undefined && { temperature: params.temperature }),
                ...(params.max_tokens !== undefined && { max_tokens: params.max_tokens }),
            });
            return {
                content: response.choices[0]?.message?.content ?? '',
                tokens_in: response.usage?.prompt_tokens ?? 0,
                tokens_out: response.usage?.completion_tokens ?? 0,
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
                    error_code: 'OPENAI_ERROR',
                    message: err instanceof Error ? err.message : String(err),
                },
            };
        }
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
//# sourceMappingURL=openai-adapter.js.map