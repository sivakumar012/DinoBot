/**
 * Environment variable loading and platform configuration.
 * Requirements: 3.9
 */
export declare const config: {
    port: number;
    nodeEnv: string;
    openaiApiKey: string | undefined;
    anthropicApiKey: string | undefined;
    databaseUrl: string | undefined;
};
/**
 * Token limits per model (context window size).
 * Used by the Context Engine to determine when trimming is needed.
 * Requirements: 4.2
 */
export declare const MODEL_TOKEN_LIMITS: Record<string, number>;
//# sourceMappingURL=config.d.ts.map