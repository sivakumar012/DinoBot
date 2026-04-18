import type { UnifiedMessage } from "./unified-message";
import type { LLMResponse } from "./llm-response";
export interface GenerateParams {
    model: string;
    messages: UnifiedMessage[];
    temperature?: number;
    max_tokens?: number;
}
export interface Provider {
    generateResponse(params: GenerateParams): Promise<LLMResponse>;
}
//# sourceMappingURL=provider.d.ts.map