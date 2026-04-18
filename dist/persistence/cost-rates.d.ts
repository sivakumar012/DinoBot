/**
 * Per-provider, per-model cost rate table and calculation utility.
 * Requirements: 7.4
 */
export interface CostRate {
    input_per_1k_tokens: number;
    output_per_1k_tokens: number;
}
export type CostRateTable = Record<string, Record<string, CostRate>>;
/**
 * Default cost rates — overridable via config/environment.
 * Requirements: 7.4
 */
export declare const DEFAULT_COST_RATES: CostRateTable;
/**
 * Calculates estimated cost for a request.
 * Returns 0 for unknown provider/model combinations.
 * Requirements: 7.4
 */
export declare function calculateCost(rates: CostRateTable, provider: string, model: string, tokensIn: number, tokensOut: number): number;
//# sourceMappingURL=cost-rates.d.ts.map