# Multi-LLM Orchestration Platform — Project Overview

## What This Project Is

A production-grade TypeScript/Node.js backend service that lets users hold persistent conversations while routing individual messages to different LLM providers (OpenAI, Anthropic). Context is preserved and adapted across providers. Every request is tracked for token usage, cost, and latency.

## Tech Stack

- **Runtime**: Node.js with TypeScript (`tsconfig.json` at root)
- **API framework**: Express (`express` 4.x)
- **Database**: `sql.js` (SQLite in-process) for dev; schema in `src/persistence/migrations/`
- **LLM SDKs**: `openai` 4.x, `@anthropic-ai/sdk` 0.36.x
- **Logging**: `pino` 9.x — always use structured logging, never `console.log`
- **Testing**: `vitest` 3.x + `fast-check` 3.x for property-based tests
- **UUIDs**: `uuid` 11.x

## Module Layout

```
src/
├── index.ts                  # Entry point — wires all modules, starts server
├── config.ts                 # Env var loading, MODEL_TOKEN_LIMITS
├── types/                    # UnifiedMessage, LLMResponse, Provider, HookFn
├── api/
│   ├── router.ts
│   ├── middleware/            # validate-request.ts, error-handler.ts
│   └── handlers/             # conversations.ts, messages.ts
├── orchestrator/             # orchestrator.ts — 7-step pipeline
├── context-engine/
│   ├── context-engine.ts
│   ├── token-counter.ts
│   └── strategies/fifo-trim.ts
├── providers/
│   ├── registry.ts           # ProviderRegistry
│   ├── openai-adapter.ts
│   └── anthropic-adapter.ts
├── hooks/hook-system.ts
├── persistence/
│   ├── db.ts
│   ├── cost-rates.ts
│   ├── migrations/
│   └── repositories/
└── utils/
    ├── logger.ts
    └── errors.ts
```

## Core Interfaces (never change these without updating all implementations)

```typescript
// UnifiedMessage — the canonical message format used everywhere
interface UnifiedMessage { role: "system" | "user" | "assistant"; content: string; }

// Provider — every adapter must implement this
interface Provider {
  generateResponse(params: GenerateParams): Promise<LLMResponse>;
}

// LLMResponse — every adapter must return this shape (success AND error)
interface LLMResponse {
  content: string; tokens_in: number; tokens_out: number;
  latency_ms: number; model: string; error?: LLMError;
}
```

## Orchestrator 7-Step Pipeline (strict order, never skip steps)

1. Load conversation history from `MessageRepository`
2. Dispatch `beforeRequest` hooks
3. Invoke `ContextEngine.buildContext`
4. Call `ProviderRegistry.resolve(provider).generateResponse`
5. Dispatch `afterResponse` hooks
6. Persist `Message` + `UsageLog` (same logical operation)
7. Return `OrchestratorResult`

## Key Design Rules

- **No provider-specific logic in the Orchestrator** — use the registry pattern exclusively.
- **No context assembly logic in the Orchestrator** — delegate to `ContextEngine`.
- **No hardcoded API keys** — all credentials via environment variables only.
- **Hooks are fire-and-forget** — a throwing hook must never interrupt the main pipeline.
- **Every request gets a UsageLog** — including failed requests (set `error_status`).
- **No raw stack traces in API responses** — log internally, return structured JSON errors.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (if using OpenAI) | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes (if using Anthropic) | Anthropic API key |
| `DATABASE_URL` | No | PostgreSQL URL (defaults to SQLite in-memory) |
| `PORT` | No | HTTP port (default 3000) |
| `NODE_ENV` | No | `development` or `production` |

## Running the Project

```bash
npm run build        # Compile TypeScript
npm run dev          # Run with ts-node (development)
npm test             # Run all tests (vitest run)
npm run test:unit    # Unit tests only
npm run test:property # Property-based tests only
npm run lint         # ESLint
```
