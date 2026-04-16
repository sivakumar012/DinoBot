# Requirements Document

## Introduction

A production-grade multi-LLM orchestration platform with a unified chat interface. The system enables users to hold a single persistent conversation while switching between multiple LLM providers (OpenAI, Anthropic, DeepSeek, Kimi) on a per-message basis. Context is preserved and adapted across providers. All requests are tracked for token usage, cost, and latency. The architecture is a single backend service with modular, composable layers: API, Orchestrator, Context Engine, Provider Adapters, Hook System, and Persistence.

## Glossary

- **Platform**: The multi-LLM orchestration system described in this document.
- **Orchestrator**: The core module responsible for coordinating the full request lifecycle — loading history, invoking hooks, calling the Context Engine, dispatching to a Provider Adapter, storing results, and returning a response.
- **Context_Engine**: The module responsible for merging conversation history, normalizing messages into the UnifiedMessage format, and trimming messages when token limits are exceeded.
- **Provider_Adapter**: A per-provider module that converts UnifiedMessage arrays into the provider's native API format, calls the provider API, and normalizes the response into an LLMResponse.
- **Hook_System**: A pluggable lifecycle mechanism that executes registered hooks at defined points in the request pipeline (beforeRequest, afterResponse, onError).
- **UnifiedMessage**: The canonical message schema used throughout the Platform: `{ role: "system" | "user" | "assistant", content: string }`.
- **LLMResponse**: The normalized response object returned by every Provider_Adapter, containing at minimum the assistant message content, token counts, and latency.
- **UsageLog**: A persisted record of a single LLM request containing tokens_in, tokens_out, latency_ms, estimated_cost, provider, model, and conversation reference.
- **Conversation**: A persisted entity grouping an ordered sequence of Messages under a single identifier.
- **Message**: A persisted record of a single turn in a Conversation, storing role, content, model_used, and token_count.
- **User**: An authenticated entity that owns Conversations.
- **Provider**: An external LLM service (OpenAI, Anthropic, DeepSeek, Kimi).
- **FIFO_Trimming**: A context trimming strategy that removes the oldest non-system messages first when the token count of the assembled context exceeds the model's limit.

---

## Requirements

### Requirement 1: Unified Message Schema and Provider Interface Contract

**User Story:** As a platform engineer, I want all providers to implement a single standard interface, so that the Orchestrator can call any provider without knowing provider-specific details.

#### Acceptance Criteria

1. THE Platform SHALL define a `UnifiedMessage` type with exactly three fields: `role` (one of `"system"`, `"user"`, `"assistant"`), and `content` (string).
2. THE Platform SHALL define a `Provider` interface requiring a `generateResponse` method with the signature: `generateResponse({ model: string, messages: UnifiedMessage[], temperature?: number, max_tokens?: number }): Promise<LLMResponse>`.
3. THE Platform SHALL define an `LLMResponse` type containing: `content` (string), `tokens_in` (number), `tokens_out` (number), `latency_ms` (number), and `model` (string).
4. WHEN a Provider_Adapter is registered with the Orchestrator, THE Platform SHALL verify at startup that the adapter satisfies the `Provider` interface.
5. IF a Provider_Adapter does not implement the required `generateResponse` method, THEN THE Platform SHALL throw a configuration error at startup and halt initialization.

---

### Requirement 2: Database Schema and Persistence

**User Story:** As a platform engineer, I want a well-defined relational schema for users, conversations, messages, and usage logs, so that all conversation state and usage data is durably stored and queryable.

#### Acceptance Criteria

1. THE Platform SHALL persist Users with at minimum: `id`, `created_at`.
2. THE Platform SHALL persist Conversations with at minimum: `id`, `user_id` (foreign key to Users), `created_at`, `updated_at`.
3. THE Platform SHALL persist Messages with: `id`, `conversation_id` (foreign key to Conversations), `role`, `content`, `model_used`, `token_count`, `created_at`.
4. THE Platform SHALL persist UsageLogs with: `id`, `conversation_id`, `message_id`, `provider`, `model`, `tokens_in`, `tokens_out`, `latency_ms`, `estimated_cost`, `created_at`.
5. WHEN a Message is stored, THE Platform SHALL record the `model_used` field with the identifier of the Provider and model that generated the response.
6. WHEN a UsageLog is stored, THE Platform SHALL record `tokens_in`, `tokens_out`, `latency_ms`, and `estimated_cost` for that request.
7. IF a database write fails, THEN THE Platform SHALL log the failure via the Hook_System's `onError` hook and return a structured error to the caller without crashing.

---

### Requirement 3: Provider Adapters — OpenAI and Anthropic (MVP)

**User Story:** As a user, I want to send messages to OpenAI and Anthropic models, so that I can use best-in-class LLMs within the same conversation.

#### Acceptance Criteria

1. THE OpenAI_Adapter SHALL implement the `Provider` interface.
2. WHEN `generateResponse` is called on the OpenAI_Adapter, THE OpenAI_Adapter SHALL convert the `UnifiedMessage` array into the OpenAI Chat Completions API request format before calling the API.
3. WHEN the OpenAI API returns a successful response, THE OpenAI_Adapter SHALL normalize the response into an `LLMResponse` object.
4. IF the OpenAI API returns an error, THEN THE OpenAI_Adapter SHALL return a structured `LLMResponse` error object and SHALL NOT throw an unhandled exception.
5. THE Anthropic_Adapter SHALL implement the `Provider` interface.
6. WHEN `generateResponse` is called on the Anthropic_Adapter, THE Anthropic_Adapter SHALL convert the `UnifiedMessage` array into the Anthropic Messages API request format before calling the API.
7. WHEN the Anthropic API returns a successful response, THE Anthropic_Adapter SHALL normalize the response into an `LLMResponse` object.
8. IF the Anthropic API returns an error, THEN THE Anthropic_Adapter SHALL return a structured `LLMResponse` error object and SHALL NOT throw an unhandled exception.
9. THE Platform SHALL store provider API keys exclusively via environment variables and SHALL NOT hardcode credentials in source code.

---

### Requirement 4: Context Engine — V1 with V2-Ready Design

**User Story:** As a user, I want my full conversation history sent to whichever model I choose, so that responses are coherent and context-aware regardless of which provider I switch to.

#### Acceptance Criteria

1. WHEN the Orchestrator invokes the Context_Engine, THE Context_Engine SHALL merge the stored conversation history into an ordered array of `UnifiedMessage` objects.
2. WHEN the assembled message array exceeds the token limit for the selected model, THE Context_Engine SHALL apply FIFO_Trimming by removing the oldest non-system messages until the token count is within the model's limit.
3. WHILE a system message is present in the conversation, THE Context_Engine SHALL preserve it and SHALL NOT remove it during FIFO_Trimming.
4. THE Context_Engine SHALL return a normalized `UnifiedMessage[]` array to the Orchestrator after processing.
5. THE Context_Engine module SHALL expose its trimming strategy as a replaceable dependency so that alternative strategies (summarization, semantic compression) can be substituted without modifying the Context_Engine's public interface.
6. WHEN the Context_Engine trims messages, THE Context_Engine SHALL record the number of messages trimmed and the reason in a structured log entry.

---

### Requirement 5: Orchestrator — Request Lifecycle

**User Story:** As a user, I want my message to be processed reliably through a consistent pipeline, so that context is always applied, usage is always tracked, and responses are always returned in a predictable format.

#### Acceptance Criteria

1. WHEN the Orchestrator receives a user message, THE Orchestrator SHALL execute the following steps in strict order: (1) load conversation history, (2) run `beforeRequest` hooks, (3) invoke the Context_Engine, (4) call the selected Provider_Adapter, (5) run `afterResponse` hooks, (6) store the response Message and UsageLog, (7) return the response.
2. THE Orchestrator SHALL accept a `provider` and `model` parameter per request to support manual model selection.
3. THE Orchestrator SHALL NOT contain any provider-specific logic and SHALL interact with providers exclusively through the `Provider` interface.
4. THE Orchestrator SHALL NOT contain any context assembly logic and SHALL delegate all context preparation to the Context_Engine.
5. IF the Provider_Adapter returns an error response, THEN THE Orchestrator SHALL run the `onError` hooks, store the error in the UsageLog, and return a structured error response to the API layer without crashing.
6. WHEN the Orchestrator stores a response, THE Orchestrator SHALL persist both the Message record and the UsageLog record within the same logical operation.

---

### Requirement 6: Hook System

**User Story:** As a platform engineer, I want a pluggable lifecycle hook system, so that I can attach logging, analytics, and future routing logic without modifying core modules.

#### Acceptance Criteria

1. THE Hook_System SHALL support three lifecycle events: `beforeRequest`, `afterResponse`, and `onError`.
2. THE Hook_System SHALL allow multiple hook functions to be registered per lifecycle event.
3. WHEN a lifecycle event is triggered, THE Hook_System SHALL invoke all registered hooks for that event in registration order.
4. WHEN a `beforeRequest` hook is triggered, THE Hook_System SHALL pass the assembled request context (conversation id, selected provider, model, message array) to each registered hook.
5. WHEN an `afterResponse` hook is triggered, THE Hook_System SHALL pass the `LLMResponse` and UsageLog data to each registered hook.
6. WHEN an `onError` hook is triggered, THE Hook_System SHALL pass the error object and available request context to each registered hook.
7. IF a hook function throws an exception, THEN THE Hook_System SHALL catch the exception, log it, and continue invoking remaining hooks for that event without interrupting the main request pipeline.
8. THE Hook_System SHALL expose a `registerHook(event, fn)` function as its public API for attaching hooks.

---

### Requirement 7: Usage Tracking

**User Story:** As a platform operator, I want every LLM request to be tracked with token counts, latency, and estimated cost, so that I can monitor spend and performance across providers.

#### Acceptance Criteria

1. THE Platform SHALL record a UsageLog entry for every request dispatched to a Provider_Adapter.
2. WHEN a Provider_Adapter returns a response, THE Platform SHALL record `tokens_in` and `tokens_out` from the `LLMResponse`.
3. WHEN a Provider_Adapter returns a response, THE Platform SHALL record `latency_ms` as the elapsed time in milliseconds from the moment the Provider_Adapter was called to the moment the response was received.
4. THE Platform SHALL calculate `estimated_cost` using a per-provider, per-model cost-per-token rate table that is configurable without code changes.
5. IF a provider request fails, THEN THE Platform SHALL still persist a UsageLog entry with the available fields populated and an error status indicator.
6. THE Platform SHALL NOT skip UsageLog persistence for any request, including failed requests.

---

### Requirement 8: API Layer

**User Story:** As a frontend developer, I want a clean REST API for managing conversations and sending messages, so that I can build a chat interface without coupling to internal platform logic.

#### Acceptance Criteria

1. THE API_Layer SHALL expose an endpoint to create a new Conversation.
2. THE API_Layer SHALL expose an endpoint to retrieve a Conversation and its Messages by conversation id.
3. THE API_Layer SHALL expose an endpoint to send a user message to a Conversation, accepting: `conversation_id`, `content`, `provider`, and `model`.
4. WHEN a send-message request is received, THE API_Layer SHALL delegate processing exclusively to the Orchestrator and SHALL NOT contain orchestration logic.
5. WHEN the Orchestrator returns a response, THE API_Layer SHALL return the assistant message content and UsageLog summary to the caller.
6. IF the Orchestrator returns an error, THEN THE API_Layer SHALL return a structured JSON error response with an appropriate HTTP status code and SHALL NOT expose internal stack traces.
7. THE API_Layer SHALL validate that `provider`, `model`, `conversation_id`, and `content` are present and non-empty before passing the request to the Orchestrator.
8. IF a required request field is missing or empty, THEN THE API_Layer SHALL return an HTTP 400 response with a descriptive error message identifying the missing field.

---

### Requirement 9: Failure Handling and Observability

**User Story:** As a platform operator, I want all failures to be caught, logged, and returned as structured errors, so that the system never crashes and all issues are observable.

#### Acceptance Criteria

1. IF a Provider_Adapter call fails for any reason, THEN THE Orchestrator SHALL return a structured error response containing: `error_code`, `provider`, `model`, and `message`.
2. THE Platform SHALL log all errors via the `onError` Hook_System event.
3. WHEN an unhandled exception occurs in any module, THE Platform SHALL catch it at the API_Layer boundary, log it via the Hook_System, and return an HTTP 500 structured error response.
4. THE Platform SHALL NOT expose raw exception stack traces in API responses.
5. WHEN a Provider_Adapter call fails, THE Platform SHALL record the failure in the UsageLog with an `error_status` field set to the error code.

---

### Requirement 10: Extensibility Constraints

**User Story:** As a platform architect, I want the system designed so that new providers, routing strategies, and context compression algorithms can be added without refactoring core modules, so that the platform can evolve without accumulating technical debt.

#### Acceptance Criteria

1. THE Orchestrator SHALL select providers exclusively by looking up a registered `Provider` implementation by name and SHALL NOT contain conditional logic branching on provider identity.
2. THE Context_Engine SHALL accept its trimming strategy as an injected dependency and SHALL NOT hardcode the FIFO_Trimming strategy.
3. THE Hook_System SHALL allow new hooks to be registered at application startup without modifying existing hook registrations.
4. WHEN a new Provider_Adapter is added, THE Platform SHALL require only: implementing the `Provider` interface and registering the adapter — no changes to the Orchestrator, Context_Engine, or Hook_System SHALL be required.
5. THE Platform SHALL maintain a provider registry that maps provider name strings to `Provider` interface implementations, enabling runtime lookup by the Orchestrator.
