export interface LLMError {
  error_code: string;
  message: string;
}

export interface LLMResponse {
  content: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  model: string;
  error?: LLMError;
}
