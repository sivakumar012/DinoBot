import type { UnifiedMessage } from "./unified-message";
import type { LLMResponse, LLMError } from "./llm-response";
export type HookEvent = "beforeRequest" | "afterResponse" | "onError";
export interface UsageLogData {
    provider: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    latency_ms: number;
    estimated_cost: number;
    error_status: string | null;
}
export interface BeforeRequestContext {
    conversation_id: string;
    provider: string;
    model: string;
    messages: UnifiedMessage[];
}
export interface AfterResponseContext {
    response: LLMResponse;
    usage: UsageLogData;
}
export interface OnErrorContext {
    error: Error | LLMError;
    conversation_id?: string;
    provider?: string;
    model?: string;
}
export type HookFn<T = unknown> = (context: T) => void | Promise<void>;
//# sourceMappingURL=hook.d.ts.map