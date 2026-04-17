---
inclusion: manual
---

# Adding a New LLM Provider

This guide covers everything needed to add a new provider adapter (e.g., DeepSeek, Kimi, Gemini) without touching the Orchestrator, Context Engine, or Hook System.

## Checklist

- [ ] Implement the `Provider` interface in `src/providers/<name>-adapter.ts`
- [ ] Add cost rates to `DEFAULT_COST_RATES` in `src/persistence/cost-rates.ts`
- [ ] Add model token limits to `MODEL_TOKEN_LIMITS` in `src/config.ts`
- [ ] Register the adapter in `src/index.ts`
- [ ] Add property tests for adapter-specific message format conversion
- [ ] Add unit tests for success and error paths

## Step 1 — Implement the Provider Interface

Create `src/providers/<name>-adapter.ts`:

```typescript
import { Provider, GenerateParams, LLMResponse } from "../types";

export class <Name>Adapter implements Provider {
  constructor(private client: <ProviderSDKClient>) {}

  async generateResponse(params: GenerateParams): Promise<LLMResponse> {
    const start = Date.now();
    try {
      // 1. Convert params.messages (UnifiedMessage[]) to provider format
      // 2. Call provider API
      // 3. Normalize response to LLMResponse
      return {
        content: "...",
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: Date.now() - start,
        model: params.model,
      };
    } catch (err) {
      // MUST catch all errors — never throw from generateResponse
      return {
        content: "",
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: Date.now() - start,
        model: params.model,
        error: { error_code: "<NAME>_ERROR", message: String(err) },
      };
    }
  }
}
```

**Rules that must hold:**
- `generateResponse` must NEVER throw — always return an `LLMResponse`, using the `error` field for failures.
- Track `latency_ms` as `Date.now()` before the API call minus `Date.now()` after.
- Preserve `role` and `content` of every `UnifiedMessage` in the order received.
- If the provider separates system messages (like Anthropic), extract them before building the messages array.

## Step 2 — Add Cost Rates

In `src/persistence/cost-rates.ts`, add an entry to `DEFAULT_COST_RATES`:

```typescript
export const DEFAULT_COST_RATES: CostRateTable = {
  // ... existing providers ...
  "<name>": {
    "<model-id>": { input_per_1k_tokens: 0.000X, output_per_1k_tokens: 0.000X },
  },
};
```

Rates are in USD per 1,000 tokens. Use the provider's published pricing page.

## Step 3 — Add Token Limits

In `src/config.ts`, add entries to `MODEL_TOKEN_LIMITS`:

```typescript
export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // ... existing models ...
  "<model-id>": 128000,
};
```

## Step 4 — Register the Adapter

In `src/index.ts`, import and register:

```typescript
import { <Name>Adapter } from "./providers/<name>-adapter";

const <name>Adapter = new <Name>Adapter(new <ProviderSDKClient>({
  apiKey: config.<NAME>_API_KEY,
}));
registry.register("<name>", <name>Adapter);
```

Add the API key to `src/config.ts` and the environment variables table in the project overview steering doc.

## Step 5 — Tests

Add a property test file `tests/property/provider-adapters.property.test.ts` (or extend the existing one):

```typescript
// Feature: multi-llm-orchestration-platform, Property 4: <Name> message format conversion preserves content
it("preserves role and content for any UnifiedMessage array", () => {
  fc.assert(
    fc.property(fc.array(unifiedMessageArb, { minLength: 1 }), (messages) => {
      // verify conversion preserves order, role, content
    }),
    { numRuns: 100 }
  );
});
```

## What You Do NOT Need to Change

- `src/orchestrator/orchestrator.ts` — resolves providers by name from the registry
- `src/context-engine/` — provider-agnostic, works with `UnifiedMessage[]`
- `src/hooks/hook-system.ts` — no provider awareness
- Any existing provider adapter
