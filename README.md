# Multi-LLM Orchestration Platform

A production-grade TypeScript/Node.js backend service for persistent AI conversations. Route individual messages to OpenAI or Anthropic, switch models per message, and track every request for tokens, cost, and latency — all within a single conversation.

---

## Architecture

```
Client
  │
  ▼ REST API
┌─────────────────────────────────────────┐
│  Express API Layer                      │
│    └── Orchestrator (7-step pipeline)   │
│          ├── Context Engine (FIFO trim) │
│          ├── Provider Registry          │
│          │     ├── OpenAI Adapter       │
│          │     └── Anthropic Adapter    │
│          ├── Hook System                │
│          └── Persistence (SQLite)       │
└─────────────────────────────────────────┘
```

### 7-Step Request Pipeline

Every message goes through these steps in strict order:

1. Load conversation history from `MessageRepository`
2. Dispatch `beforeRequest` hooks
3. Invoke `ContextEngine.buildContext` (trim to model token limit)
4. Call `ProviderRegistry.resolve(provider).generateResponse`
5. Dispatch `afterResponse` hooks
6. Persist `Message` + `UsageLog`
7. Return `OrchestratorResult`

---

## Project Structure

```
src/
├── index.ts                        # Entry point — wires all modules, starts server
├── config.ts                       # Env var loading, MODEL_TOKEN_LIMITS
├── types/
│   ├── unified-message.ts          # UnifiedMessage, MessageRole
│   ├── llm-response.ts             # LLMResponse, LLMError
│   ├── provider.ts                 # Provider interface, GenerateParams
│   ├── hook.ts                     # HookEvent, HookFn, context types, UsageLogData
│   └── index.ts                    # Re-exports
├── api/
│   ├── router.ts                   # Route definitions
│   ├── middleware/
│   │   ├── validate-request.ts     # Required field validation → HTTP 400
│   │   └── error-handler.ts        # Global error boundary → structured JSON
│   └── handlers/
│       ├── conversations.ts        # POST /conversations, GET /conversations/:id
│       └── messages.ts             # POST /conversations/:id/messages
├── orchestrator/
│   └── orchestrator.ts             # Core 7-step pipeline
├── context-engine/
│   ├── context-engine.ts           # Context assembly + strategy dispatch
│   ├── token-counter.ts            # Approximate token counting
│   └── strategies/
│       └── fifo-trim.ts            # V1 FIFO trimming strategy
├── providers/
│   ├── registry.ts                 # ProviderRegistry — name → Provider map
│   ├── openai-adapter.ts           # OpenAI Chat Completions adapter
│   └── anthropic-adapter.ts        # Anthropic Messages API adapter
├── hooks/
│   └── hook-system.ts              # registerHook, dispatch, error isolation
├── persistence/
│   ├── db.ts                       # sql.js SQLite connection + migration runner
│   ├── cost-rates.ts               # Per-provider cost rate table + calculateCost
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # users, conversations, messages, usage_logs
│   └── repositories/
│       ├── user-repository.ts              # UserRepository interface
│       ├── user-repository.impl.ts         # SqliteUserRepository
│       ├── conversation-repository.ts      # ConversationRepository interface
│       ├── conversation-repository.impl.ts # SqliteConversationRepository
│       ├── message-repository.ts           # MessageRepository interface
│       ├── message-repository.impl.ts      # SqliteMessageRepository
│       ├── usage-log-repository.ts         # UsageLogRepository interface
│       └── usage-log-repository.impl.ts    # SqliteUsageLogRepository
└── utils/
    ├── logger.ts                   # Structured logger (pino)
    └── errors.ts                   # PlatformError, ValidationError, ProviderError, etc.

tests/
├── unit/                           # Example-based tests
└── property/                       # Property-based tests (fast-check)
```

---

## Implementation Status

| Phase | Description | Status |
|---|---|---|
| 1 | Database schema, migrations, repositories | ✅ Complete |
| 2 | Core types and interfaces | ✅ Complete |
| 3 | Provider adapters (OpenAI, Anthropic, Registry) | 🔄 In progress |
| 4 | Context Engine (token counting, FIFO trim) | 🔄 In progress |
| 5 | Hook System | 🔄 In progress |
| 6 | Usage tracking and cost calculation | 🔄 In progress |
| 7 | Orchestrator (7-step pipeline) | 🔄 In progress |
| 8 | API Layer (routes, middleware, handlers) | 🔄 In progress |
| 9 | Integration tests, README, final validation | ⏳ Pending |

---

## API Endpoints

### `POST /conversations`
Create a new conversation.

```json
// Request
{ "user_id": "string" }

// Response 201
{ "id": "uuid", "user_id": "uuid", "created_at": "ISO8601", "updated_at": "ISO8601" }
```

### `GET /conversations/:id`
Retrieve a conversation and its messages.

```json
// Response 200
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "messages": [
    {
      "id": "uuid",
      "role": "user | assistant | system",
      "content": "string",
      "model_used": "string | null",
      "token_count": 42,
      "created_at": "ISO8601"
    }
  ]
}
```

### `POST /conversations/:id/messages`
Send a user message and receive an assistant response.

```json
// Request
{
  "content": "string",
  "provider": "openai | anthropic",
  "model": "string",
  "temperature": 0.7,
  "max_tokens": 1024
}

// Response 200
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "string",
    "model_used": "string",
    "created_at": "ISO8601"
  },
  "usage": {
    "provider": "openai",
    "model": "gpt-4o",
    "tokens_in": 512,
    "tokens_out": 128,
    "latency_ms": 843,
    "estimated_cost": 0.00448
  }
}
```

**Error responses** always follow this shape — no stack traces exposed:

```json
{ "error": { "error_code": "VALIDATION_ERROR", "message": "Field \"provider\" is required and must not be empty" } }
```

| Status | Error code | Cause |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or empty required field |
| 404 | `NOT_FOUND` | Conversation id does not exist |
| 502 | `PROVIDER_ERROR` | LLM API returned an error |
| 500 | `DATABASE_ERROR` | Persistence failure |
| 500 | `INTERNAL_ERROR` | Unhandled exception |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | If using OpenAI | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | If using Anthropic | — | Anthropic API key |
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DATABASE_URL` | No | SQLite in-memory | PostgreSQL URL (future) |
| `LOG_LEVEL` | No | `info` | pino log level |

API keys are never hardcoded — credentials are loaded exclusively from environment variables.

---

## Supported Models

| Provider | Model | Context Window |
|---|---|---|
| OpenAI | `gpt-4o` | 128,000 tokens |
| OpenAI | `gpt-4o-mini` | 128,000 tokens |
| OpenAI | `gpt-4-turbo` | 128,000 tokens |
| OpenAI | `gpt-3.5-turbo` | 16,385 tokens |
| Anthropic | `claude-3-5-sonnet-20241022` | 200,000 tokens |
| Anthropic | `claude-3-5-haiku-20241022` | 200,000 tokens |
| Anthropic | `claude-3-opus-20240229` | 200,000 tokens |

---

## Getting Started

```bash
npm install
npm run dev        # Development with ts-node
npm run build      # Compile TypeScript → dist/
```

---

## Testing

```bash
npm test                 # All tests (vitest run)
npm run test:unit        # Unit tests only
npm run test:property    # Property-based tests only
```

Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 runs each, validating 15 correctness properties defined in the design document.

---

## Core Type Contracts

These interfaces are the integration points between all modules. They must not change without updating all implementations.

```typescript
// Canonical message format used everywhere
interface UnifiedMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Every provider adapter must implement this
interface Provider {
  generateResponse(params: GenerateParams): Promise<LLMResponse>;
}

// Every adapter returns this shape — for both success and error
interface LLMResponse {
  content: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  model: string;
  error?: LLMError;  // populated on failure, never throws
}
```

---

## Adding a New Provider

1. Implement `Provider` interface in `src/providers/<name>-adapter.ts`
2. Add cost rates to `DEFAULT_COST_RATES` in `src/persistence/cost-rates.ts`
3. Add token limits to `MODEL_TOKEN_LIMITS` in `src/config.ts`
4. Register in `src/index.ts` — no other files need changing

See `.kiro/steering/adding-providers.md` for the full step-by-step guide.

---

## Key Design Decisions

- **Registry pattern** — the Orchestrator resolves providers by name at request time, never imports them directly. Adding a provider requires zero changes to the Orchestrator.
- **Strategy pattern** — the Context Engine accepts `TrimStrategy` as an injected dependency, making FIFO and future summarization strategies interchangeable without touching the engine.
- **Hooks are fire-and-forget** — a throwing hook is caught and logged, never interrupting the main pipeline.
- **Every request gets a UsageLog** — including failed requests (`error_status` is set on failure, never skipped).
- **No stack traces in API responses** — errors are logged internally via pino; responses return structured JSON only.

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| Runtime | Node.js + TypeScript | TS 5.8 |
| API framework | Express | 4.21 |
| Database | sql.js (SQLite in-process) | 1.12 |
| OpenAI SDK | openai | 4.86 |
| Anthropic SDK | @anthropic-ai/sdk | 0.36 |
| Logging | pino | 9.6 |
| UUIDs | uuid | 11.1 |
| Test runner | vitest | 3.0 |
| Property tests | fast-check | 3.23 |
