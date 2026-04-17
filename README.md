# Multi-LLM Orchestration Platform

A production-grade TypeScript/Node.js backend service for persistent multi-provider LLM conversations. Route individual messages to OpenAI or Anthropic while preserving full conversation context across providers. Every request is tracked for token usage, cost, and latency.

---

## Architecture

The platform is a single-process service built from composable, loosely-coupled modules:

```
Client → API Layer (Express)
           → Orchestrator (7-step pipeline)
               → Context Engine (FIFO trimming)
               → Provider Registry → OpenAI / Anthropic adapters
               → Hook System (beforeRequest / afterResponse / onError)
               → Persistence Layer (SQLite in-memory)
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
├── index.ts                          # Entry point — wires all modules, starts server
├── config.ts                         # Env var loading, MODEL_TOKEN_LIMITS
├── types/
│   ├── unified-message.ts            # UnifiedMessage type
│   ├── llm-response.ts               # LLMResponse, LLMError types
│   ├── provider.ts                   # Provider interface, GenerateParams
│   ├── hook.ts                       # HookEvent, HookFn, context types
│   └── index.ts                      # Re-exports
├── api/
│   ├── router.ts                     # Route definitions
│   ├── middleware/
│   │   ├── validate-request.ts       # Field presence/non-empty validation
│   │   └── error-handler.ts          # Global error boundary (no stack traces)
│   └── handlers/
│       ├── conversations.ts          # POST /conversations, GET /conversations/:id
│       └── messages.ts               # POST /conversations/:id/messages
├── orchestrator/
│   └── orchestrator.ts               # Core 7-step pipeline
├── context-engine/
│   ├── context-engine.ts             # Context assembly + strategy dispatch
│   ├── token-counter.ts              # Approximate token counting (~1.3 tokens/word)
│   └── strategies/
│       └── fifo-trim.ts              # V1 FIFO trimming strategy
├── providers/
│   ├── registry.ts                   # ProviderRegistry — name → Provider map
│   ├── openai-adapter.ts             # OpenAI Chat Completions adapter
│   └── anthropic-adapter.ts          # Anthropic Messages API adapter
├── hooks/
│   └── hook-system.ts                # registerHook, dispatch, error isolation
├── persistence/
│   ├── db.ts                         # sql.js in-memory SQLite singleton
│   ├── cost-rates.ts                 # Cost rate table + calculateCost()
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # users, conversations, messages, usage_logs
│   └── repositories/
│       ├── user-repository.ts / .impl.ts
│       ├── conversation-repository.ts / .impl.ts
│       ├── message-repository.ts / .impl.ts
│       └── usage-log-repository.ts / .impl.ts
└── utils/
    ├── logger.ts                     # Structured pino logger
    └── errors.ts                     # PlatformError, ValidationError, ProviderError, etc.
```

---

## API Endpoints

All routes are mounted under `/api`.

### `POST /api/conversations`

Create a new conversation.

**Request body:**
```json
{ "user_id": "string" }
```

**Response `201`:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

### `GET /api/conversations/:id`

Retrieve a conversation and its messages.

**Response `200`:**
```json
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

**Response `404`:**
```json
{ "error": { "error_code": "NOT_FOUND", "message": "Conversation with id \"...\" not found" } }
```

---

### `POST /api/conversations/:id/messages`

Send a user message and receive an assistant response.

**Request body:**
```json
{
  "content": "string",
  "provider": "openai | anthropic",
  "model": "string",
  "temperature": 0.7,
  "max_tokens": 1024
}
```
`temperature` and `max_tokens` are optional.

**Response `200`:**
```json
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

**Response `400`** (missing/empty field):
```json
{ "error": { "error_code": "VALIDATION_ERROR", "message": "Field \"provider\" is required and must not be empty" } }
```

**Response `502`** (provider error):
```json
{ "error": { "error_code": "PROVIDER_ERROR", "message": "...", "provider": "openai", "model": "gpt-4o" } }
```

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

## Running the Project

```bash
# Install dependencies
npm install

# Development (ts-node, hot reload not included)
npm run dev

# Build TypeScript to dist/
npm run build

# Lint
npm run lint
```

---

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Property-based tests only
npm run test:property
```

**Current status: 17 test files, 108 tests, all passing.**

### Test layout

```
tests/
├── unit/
│   ├── setup.test.ts
│   ├── api/
│   │   ├── conversations.test.ts
│   │   └── messages.test.ts
│   ├── context-engine/
│   │   └── context-engine.test.ts
│   ├── hooks/
│   │   └── hook-system.test.ts
│   ├── orchestrator/
│   │   └── orchestrator.test.ts
│   └── persistence/
│       └── repositories.test.ts
└── property/
    ├── setup.property.test.ts
    ├── unified-message.property.test.ts      # Property 1
    ├── llm-response.property.test.ts         # Property 2
    ├── provider-adapters.property.test.ts    # Properties 3, 4, 5
    ├── persistence.property.test.ts          # Property 6
    ├── context-engine.property.test.ts       # Properties 7, 8
    ├── hook-system.property.test.ts          # Properties 9, 10
    ├── usage-tracking.property.test.ts       # Properties 11, 12
    ├── api-validation.property.test.ts       # Properties 13, 14
    └── provider-registry.property.test.ts    # Property 15
```

Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 runs each. Each property maps 1:1 to a numbered correctness property in `.kiro/specs/multi-llm-orchestration-platform/design.md`.

Repository unit tests use a real in-memory SQLite database — the DB layer is never mocked in persistence tests.

---

## Adding a New Provider

1. Implement the `Provider` interface in `src/providers/your-adapter.ts`:

```typescript
import type { Provider, GenerateParams } from '../types/provider';
import type { LLMResponse } from '../types/llm-response';

export class YourAdapter implements Provider {
  async generateResponse(params: GenerateParams): Promise<LLMResponse> {
    const start = Date.now();
    try {
      // call your API...
      return { content, tokens_in, tokens_out, latency_ms: Date.now() - start, model: params.model };
    } catch (err) {
      return { content: '', tokens_in: 0, tokens_out: 0, latency_ms: Date.now() - start, model: params.model,
        error: { error_code: 'YOUR_ERROR', message: String(err) } };
    }
  }
}
```

2. Register it in `src/index.ts`:

```typescript
registry.register('yourprovider', new YourAdapter(client));
```

No changes to the Orchestrator, Context Engine, or Hook System are required.

---

## Key Design Decisions

- **Registry pattern** — the Orchestrator never imports a provider directly; it resolves adapters by name at request time.
- **Strategy pattern** — the Context Engine accepts a `TrimStrategy` function as a constructor argument, making FIFO and future summarization strategies interchangeable.
- **Hooks are fire-and-forget** — a throwing hook is caught and logged; it never interrupts the main pipeline.
- **Every request gets a UsageLog** — including failed requests (`error_status` is set on failure).
- **No stack traces in API responses** — errors are logged internally via pino; responses return structured JSON only.
- **SQLite in-process** — uses `sql.js` (WebAssembly SQLite) for zero-dependency local development. Schema is in `src/persistence/migrations/001_initial_schema.sql`.

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
