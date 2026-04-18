"use strict";
/**
 * Per-provider, per-model cost rate table and calculation utility.
 * Requirements: 7.4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COST_RATES = void 0;
exports.calculateCost = calculateCost;
/**
 * Default cost rates — overridable via config/environment.
 * Requirements: 7.4
 */
exports.DEFAULT_COST_RATES = {
    openai: {
        'gpt-4o': { input_per_1k_tokens: 0.005, output_per_1k_tokens: 0.015 },
        'gpt-4o-mini': { input_per_1k_tokens: 0.00015, output_per_1k_tokens: 0.0006 },
        'gpt-4-turbo': { input_per_1k_tokens: 0.01, output_per_1k_tokens: 0.03 },
        'gpt-3.5-turbo': { input_per_1k_tokens: 0.0005, output_per_1k_tokens: 0.0015 },
    },
    anthropic: {
        'claude-3-5-sonnet-20241022': { input_per_1k_tokens: 0.003, output_per_1k_tokens: 0.015 },
        'claude-3-5-haiku-20241022': { input_per_1k_tokens: 0.001, output_per_1k_tokens: 0.005 },
        'claude-3-opus-20240229': { input_per_1k_tokens: 0.015, output_per_1k_tokens: 0.075 },
    },
};
/**
 * Calculates estimated cost for a request.
 * Returns 0 for unknown provider/model combinations.
 * Requirements: 7.4
 */
function calculateCost(rates, provider, model, tokensIn, tokensOut) {
    const rate = rates[provider]?.[model];
    if (!rate)
        return 0;
    return ((tokensIn / 1000) * rate.input_per_1k_tokens +
        (tokensOut / 1000) * rate.output_per_1k_tokens);
}
//# sourceMappingURL=cost-rates.js.map