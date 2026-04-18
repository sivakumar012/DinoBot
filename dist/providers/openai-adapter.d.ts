import OpenAI from 'openai';
import type { Provider, GenerateParams } from '../types/provider';
import type { LLMResponse } from '../types/llm-response';
/**
 * OpenAI Chat Completions adapter implementing the Provider interface.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.9
 */
export declare class OpenAIAdapter implements Provider {
    private client;
    constructor(client: OpenAI);
    generateResponse(params: GenerateParams): Promise<LLMResponse>;
}
//# sourceMappingURL=openai-adapter.d.ts.map