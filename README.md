# Multi-LLM Orchestration Platform

> A production-grade TypeScript/Node.js backend + React Native mobile app for persistent AI conversations — route messages to OpenAI or Anthropic, switch models per message, and track every request for tokens, cost, and latency.

---

## What This Is

A full-stack AI chat system with two parts:

- **Backend** (`src/`) — Express REST API with a 7-step orchestration pipeline, context engine, provider registry, hook system, and SQLite persistence
- **Mobile** (`mobile/`) — React Native app for iOS and Android, Play Store and App Store compliant, with AI disclosure, offline resilience, and content flagging

---

## Architecture

```
React Native App (iOS / Android)
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
├── src/                              # Backend (Node.js / TypeScript)
│   ├── index.ts                      # Entry point — wires all modules, starts server
│   ├── config.ts                     # Env var loading, MODEL_TOKEN_LIMITS
│   ├── types/                        # UnifiedMessage, LLMResponse, Provider, HookFn
│   ├── api/
│   │   ├── router.ts                 # Route definitions
│   │   ├── middleware/               # validate-request.ts, error-handler.ts
│   │   └── handlers/
│   │       ├── conversations.ts      # POST /conversations, GET /conversations/:id
│   │       ├── messages.ts           # POST /conversations/:id/messages
│   │       └── moderation.ts         # POST /moderation/flag, GET /moderation/flags
│   ├── orchestrator/orchestrator.ts  # Core 7-step pipeline
│   ├── context-engine/               # Context assembly + FIFO trimming strategy
│   ├── providers/                    # ProviderRegistry, OpenAI + Anthropic adapters
│   ├── hooks/hook-system.ts          # registerHook, dispatch, error isolation
│   ├── persistence/                  # sql.js SQLite, repositories, cost rates
│   └── utils/                        # Structured logger (pino), typed errors
│
├── mobile/                           # React Native app (iOS + Android)
│   ├── App.tsx                       # Root: navigation + AI disclosure gate
│   ├── src/
│   │   ├── api/client.ts             # Typed API client
│   │   ├── store/                    # Zustand: chat state + settings
│   │   ├── screens/                  # Home, Chat, Settings
│   │   ├── components/               # MessageBubble, ProviderPicker, OfflineBanner,
│   │   │                             # AIDisclosure, ReportFlagModal, UsageBadge
│   │   ├── hooks/                    # useNetInfo, useStreamingDots
│   │   └── theme/                    # Design tokens (colors, spacing, typography)
│   └── scripts/                      # Keystore generation + AAB release build
│
├── Dockerfile                        # Production container
├── render.yaml                       # One-click Render deploy
└── fly.toml                          # Fly.io deploy config
```

---

## API Endpoints

All routes are mounted under `/api`.

### `POST /api/conversations`
Create a new conversation.

```json
// Request
{ "user_id": "string" }

// Response 201
{ "id": "uuid", "user_id": "uuid", "created_at": "ISO8601", "updated_at": "ISO8601" }
```

### `GET /api/conversations/:id`
Retrieve a conversation and its messages.

```json
// Response 200
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "messages": [
    { "id": "uuid", "role": "user | assistant | system", "content": "string",
      "model_used": "string | null", "token_count": 42, "created_at": "ISO8601" }
  ]
}
```

### `POST /api/conversations/:id/messages`
Send a user message and receive an assistant response.

```json
// Request
{ "content": "string", "provider": "openai | anthropic", "model": "string",
  "temperature": 0.7, "max_tokens": 1024 }

// Response 200
{
  "message": { "id": "uuid", "role": "assistant", "content": "string",
               "model_used": "string", "created_at": "ISO8601" },
  "usage": { "provider": "openai", "model": "gpt-4o", "tokens_in": 512,
             "tokens_out": 128, "latency_ms": 843, "estimated_cost": 0.00448 }
}
```

### `POST /api/moderation/flag`
Report an AI-generated message (store-compliance: GenAI Safety 2026).

```json
// Request
{ "message_id": "uuid", "conversation_id": "uuid",
  "reason": "harmful | inaccurate | inappropriate | privacy | other",
  "details": "optional string" }

// Response 201
{ "id": "uuid", "status": "received" }
```

### `GET /health`
Health check for deployment platforms (Railway, Render, Fly.io).

```json
{ "status": "ok", "uptime": 42.3 }
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

## Running the Backend

```bash
npm install
npm run dev        # Development with ts-node
npm run build      # Compile TypeScript → dist/
npm run lint       # ESLint
```

## Running the Mobile App

```bash
# First-time setup (generates android/ and ios/ native projects)
bash mobile/setup.sh

cd mobile
npm start          # Metro bundler
npm run android    # Android emulator
npm run ios        # iOS simulator
```

See `mobile/README.md` for full mobile setup instructions.

---

## Deployment

### Render (recommended for quick start)
```bash
# Push to GitHub, connect repo in Render dashboard, select render.yaml
# Set OPENAI_API_KEY and ANTHROPIC_API_KEY in Render environment settings
```

### Fly.io
```bash
fly launch
fly secrets set OPENAI_API_KEY=... ANTHROPIC_API_KEY=...
fly deploy
```

### Docker
```bash
docker build -t multi-llm-api .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=... \
  -e ANTHROPIC_API_KEY=... \
  multi-llm-api
```

---

## Testing

```bash
npm test                # All tests
npm run test:unit       # Unit tests only
npm run test:property   # Property-based tests only
```

**17 test files · 108 tests · all passing**

Property tests use [fast-check](https://github.com/dubzzz/fast-check) with 100 runs minimum each, validating 15 correctness properties defined in `.kiro/specs/multi-llm-orchestration-platform/design.md`.

---

## Store Compliance (Mobile)

| Requirement | Implementation |
|---|---|
| AI Use Disclosure (2026 Mandate) | `AIDisclosure` modal on first launch |
| Report/Flag mechanism | 🚩 button on every assistant message |
| Offline resilience | `OfflineBanner` + disabled send on every screen |
| No dynamic code | No eval(), no remote JS loading |
| Privacy-first | Zero permissions requested |
| State management | Zustand (industry standard) |

---

## Adding a New Provider

1. Implement `Provider` interface in `src/providers/your-adapter.ts`
2. Add cost rates to `DEFAULT_COST_RATES` in `src/persistence/cost-rates.ts`
3. Add token limits to `MODEL_TOKEN_LIMITS` in `src/config.ts`
4. Register in `src/index.ts` — no other files need changing

See `.kiro/steering/adding-providers.md` for the full guide.

---

## Key Design Decisions

- **Registry pattern** — the Orchestrator resolves providers by name at request time, never imports them directly
- **Strategy pattern** — the Context Engine accepts `TrimStrategy` as an injected dependency, making FIFO and future summarization strategies interchangeable
- **Hooks are fire-and-forget** — a throwing hook is caught and logged, never interrupting the main pipeline
- **Every request gets a UsageLog** — including failed requests (`error_status` set on failure)
- **No stack traces in API responses** — errors logged internally via pino, responses return structured JSON only

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
| Mobile framework | React Native | 0.76 |
| Mobile state | Zustand | 5.0 |
| Mobile navigation | React Navigation | 6.x |
