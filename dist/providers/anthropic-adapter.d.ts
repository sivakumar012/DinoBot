import Anthropic from '@anthropic-ai/sdk';
import type { Provider, GenerateParams } from '../types/provider';
import type { LLMResponse } from '../types/llm-response';
/**
 * Anthropic Messages API adapter implementing the Provider interface.
 * Requirements: 3.5, 3.6, 3.7, 3.8, 3.9
 */
export declare class AnthropicAdapter implements Provider {
    private client;
    constructor(client: Anthropic);
    generateResponse(params: GenerateParams): Promise<LLMResponse>;
}
//# sourceMappingURL=anthropic-adapter.d.ts.map