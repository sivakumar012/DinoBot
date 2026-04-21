# Implementation Plan: Multi-LLM Orchestration Platform

## Overview

This implementation plan follows a strict bottom-up development order: database schema → core types and interfaces → provider adapters → context engine → orchestrator → hook system → API layer → minimal UI. Each phase builds on the previous, with property-based tests integrated as sub-tasks to validate correctness properties early.

The tech stack is TypeScript/Node.js with fast-check for property-based testing, SQLite (dev) / PostgreSQL (prod) via Knex or better-sqlite3, Express or Fastify for the API layer, and pino or winston for structured logging.

---

## Tasks

### Phase 1: Database Schema and Persistence Layer

- [x] 1. Set up project structure and dependencies
  - Initialize TypeScript Node.js project with tsconfig.json
  - Install dependencies: TypeScript, Node types, Knex or better-sqlite3, fast-check, Jest or Vitest, pino or winston
  - Create directory structure: `src/`, `src/types/`, `src/persistence/`, `src/api/`, `src/orchestrator/`, `src/context-engine/`, `src/providers/`, `src/hooks/`, `src/utils/`, `tests/unit/`, `tests/property/`
  - Set up test framework configuration
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Define database schema and migrations
  - [x] 2.1 Create SQL migration file for initial schema
    - Define `users` table with `id`, `created_at`
    - Define `conversations` table with `id`, `user_id`, `created_at`, `updated_at`
    - Define `messages` table with `id`, `conversation_id`, `role`, `content`, `model_used`, `token_count`, `created_at`
    - Define `usage_logs` table with `id`, `conversation_id`, `message_id`, `provider`, `model`, `tokens_in`, `tokens_out`, `latency_ms`, `estimated_cost`, `error_status`, `created_at`
    - Add indexes for `conversations.user_id`, `messages.conversation_id`, `usage_logs.conversation_id`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implement database connection module
    - Create `src/persistence/db.ts` with connection setup for SQLite (dev) and PostgreSQL (prod)
    - Implement migration runner
    - _Requirements: 2.1_

- [x] 3. Implement repository interfaces and implementations
  - [x] 3.1 Create repository interfaces
    - Define `UserRepository` interface in `src/persistence/repositories/user-repository.ts`
    - Define `ConversationRepository` interface in `src/persistence/repositories/conversation-repository.ts`
    - Define `MessageRepository` interface in `src/persistence/repositories/message-repository.ts`
    - Define `UsageLogRepository` interface in `src/persistence/repositories/usage-log-repository.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Implement repository classes
    - Implement `UserRepository` with `create`, `findById` methods
    - Implement `ConversationRepository` with `create`, `findById`, `touch` methods
    - Implement `MessageRepository` with `save`, `findByConversationId` methods
    - Implement `UsageLogRepository` with `save`, `findByConversationId` methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.3 Write property test for persistence round-trip fidelity
    - **Property 6: Persistence round-trip fidelity**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
    - Test that any Message or UsageLog saved and retrieved has all fields preserved
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.4 Write unit tests for repository implementations
    - Test create, save, and find operations for all repositories
    - Test foreign key constraints and cascading deletes
    - Test error handling for database write failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 2: Core Types and Interfaces

- [-] 5. Define UnifiedMessage and core type system
  - [x] 5.1 Create UnifiedMessage type
    - Define `MessageRole` type as `"system" | "user" | "assistant"`
    - Define `UnifiedMessage` interface with `role: MessageRole` and `content: string`
    - Create `src/types/unified-message.ts`
    - _Requirements: 1.1_

  - [ ]* 5.2 Write property test for UnifiedMessage role invariant
    - **Property 1: UnifiedMessage role invariant**
    - **Validates: Requirements 1.1**
    - Test that any UnifiedMessage has role in {"system", "user", "assistant"} and content is a string
    - _Requirements: 1.1_

  - [ ] 5.3 Create LLMResponse type
    - Define `LLMError` interface with `error_code: string` and `message: string`
    - Define `LLMResponse` interface with `content`, `tokens_in`, `tokens_out`, `latency_ms`, `model`, and optional `error`
    - Create `src/types/llm-response.ts`
    - _Requirements: 1.3_

  - [ ]* 5.4 Write property test for LLMResponse structural completeness
    - **Property 2: LLMResponse structural completeness**
    - **Validates: Requirements 1.3, 3.3, 3.7**
    - Test that any LLMResponse contains all five required fields
    - _Requirements: 1.3_

  - [ ] 5.5 Create Provider interface
    - Define `GenerateParams` interface with `model`, `messages`, optional `temperature`, optional `max_tokens`
    - Define `Provider` interface with `generateResponse(params: GenerateParams): Promise<LLMResponse>`
    - Create `src/types/provider.ts`
    - _Requirements: 1.2_

  - [ ] 5.6 Create Hook types
    - Define `HookEvent` type as `"beforeRequest" | "afterResponse" | "onError"`
    - Define `BeforeRequestContext`, `AfterResponseContext`, `OnErrorContext` interfaces
    - Define `HookFn<T>` type
    - Create `src/types/hook.ts`
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

  - [ ] 5.7 Create type index file
    - Re-export all types from `src/types/index.ts`
    - _Requirements: 1.1, 1.2, 1.3_

---

### Phase 3: Provider Adapters

- [ ] 6. Implement OpenAI adapter
  - [ ] 6.1 Create OpenAI adapter class
    - Implement `OpenAIAdapter` class that implements `Provider` interface
    - Implement `generateResponse` method that converts UnifiedMessage[] to OpenAI Chat Completions format
    - Call OpenAI API and normalize response to LLMResponse
    - Catch all errors and return LLMResponse with error field (no unhandled exceptions)
    - Track latency using Date.now() before and after API call
    - Create `src/providers/openai-adapter.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9_

  - [ ]* 6.2 Write property test for OpenAI message format conversion
    - **Property 4: OpenAI message format conversion preserves content**
    - **Validates: Requirements 3.2**
    - Test that any UnifiedMessage[] passed to OpenAI adapter preserves role and content in order
    - _Requirements: 3.2_

  - [ ]* 6.3 Write property test for provider adapter error isolation
    - **Property 3: Provider adapter error isolation**
    - **Validates: Requirements 3.4, 3.8**
    - Test that any error from OpenAI API is caught and returned as LLMResponse with error field
    - _Requirements: 3.4_

  - [ ]* 6.4 Write unit tests for OpenAI adapter
    - Test successful response normalization
    - Test error response handling
    - Test latency tracking
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement Anthropic adapter
  - [ ] 7.1 Create Anthropic adapter class
    - Implement `AnthropicAdapter` class that implements `Provider` interface
    - Implement `generateResponse` method that separates system messages from conversation messages
    - Convert UnifiedMessage[] to Anthropic Messages API format (system as separate parameter)
    - Call Anthropic API and normalize response to LLMResponse
    - Catch all errors and return LLMResponse with error field (no unhandled exceptions)
    - Track latency using Date.now() before and after API call
    - Create `src/providers/anthropic-adapter.ts`
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 7.2 Write property test for Anthropic system message separation
    - **Property 5: Anthropic system message separation**
    - **Validates: Requirements 3.6**
    - Test that any UnifiedMessage[] with system message has it extracted to system parameter
    - _Requirements: 3.6_

  - [ ]* 7.3 Write unit tests for Anthropic adapter
    - Test successful response normalization
    - Test system message extraction
    - Test error response handling
    - Test latency tracking
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [ ] 8. Implement Provider Registry
  - [ ] 8.1 Create ProviderRegistry class
    - Implement `register(name, adapter)` method with Provider interface validation
    - Implement `resolve(name)` method that returns registered adapter or throws error
    - Implement `list()` method that returns array of registered provider names
    - Create `src/providers/registry.ts`
    - _Requirements: 1.4, 10.1, 10.4, 10.5_

  - [ ]* 8.2 Write property test for provider registry round-trip
    - **Property 15: Provider registry round-trip**
    - **Validates: Requirements 10.5, 1.4**
    - Test that any provider registered can be resolved to the same instance
    - Test that resolving unregistered name throws error
    - _Requirements: 10.5, 1.4_

  - [ ]* 8.3 Write unit tests for ProviderRegistry
    - Test registration validation (rejects non-Provider objects)
    - Test resolve throws error for unregistered names
    - Test list returns all registered names
    - _Requirements: 1.4, 10.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 4: Context Engine

- [ ] 10. Implement token counting utility
  - Create `src/context-engine/token-counter.ts` with approximate token counting function
  - Implement simple heuristic (e.g., word count * 1.3) or integrate tiktoken library
  - _Requirements: 4.2_

- [ ] 11. Implement FIFO trimming strategy
  - [ ] 11.1 Create FIFO trim strategy function
    - Implement `TrimStrategy` function type
    - Implement `fifoTrim` function that removes oldest non-system messages until under token limit
    - Preserve system messages during trimming
    - Return trimmed message array and count of removed messages
    - Create `src/context-engine/strategies/fifo-trim.ts`
    - _Requirements: 4.2, 4.3_

  - [ ]* 11.2 Write property test for system message preservation during trimming
    - **Property 8: System message preservation during trimming**
    - **Validates: Requirements 4.3**
    - Test that any message array with system message and exceeding token limit still has system message after trimming
    - _Requirements: 4.3_

  - [ ]* 11.3 Write unit tests for FIFO trimming
    - Test trimming removes oldest messages first
    - Test system message is never removed
    - Test trimming stops when under token limit
    - _Requirements: 4.2, 4.3_

- [ ] 12. Implement Context Engine
  - [ ] 12.1 Create ContextEngine class
    - Define `ContextEngineOptions` interface with `trimStrategy` and `modelTokenLimits`
    - Implement `buildContext(history, model)` method that applies trim strategy
    - Log trimming events with structured logger
    - Return normalized UnifiedMessage[] and trimmed count
    - Create `src/context-engine/context-engine.ts`
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

  - [ ]* 12.2 Write property test for context engine token limit enforcement
    - **Property 7: Context Engine token limit enforcement**
    - **Validates: Requirements 4.2**
    - Test that any message array exceeding token limit is trimmed to be under limit
    - _Requirements: 4.2_

  - [ ]* 12.3 Write unit tests for ContextEngine
    - Test buildContext returns normalized messages
    - Test trimming is applied when over token limit
    - Test trimming is skipped when under token limit
    - Test structured logging of trim events
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [ ] 13. Create model token limits configuration
  - Define `MODEL_TOKEN_LIMITS` constant in `src/config.ts` with limits for all supported models
  - Include OpenAI models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
  - Include Anthropic models: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
  - _Requirements: 4.2_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 5: Hook System

- [ ] 15. Implement Hook System
  - [ ] 15.1 Create HookSystem class
    - Implement `registerHook(event, fn)` method that stores hooks in a map by event type
    - Implement `dispatch(event, context)` method that invokes all registered hooks in order
    - Catch and log exceptions from individual hooks without propagating
    - Create `src/hooks/hook-system.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

  - [ ]* 15.2 Write property test for hook invocation completeness and ordering
    - **Property 9: Hook invocation completeness and ordering**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 10.3**
    - Test that any N registered hooks are all invoked in registration order with correct context
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 15.3 Write property test for hook failure isolation
    - **Property 10: Hook failure isolation**
    - **Validates: Requirements 6.7**
    - Test that any throwing hook does not prevent subsequent hooks from executing
    - _Requirements: 6.7_

  - [ ]* 15.4 Write unit tests for HookSystem
    - Test registerHook stores hooks correctly
    - Test dispatch invokes all hooks with correct context
    - Test dispatch catches and logs hook exceptions
    - Test multiple hooks for same event are invoked in order
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

---

### Phase 6: Usage Tracking and Cost Calculation

- [ ] 16. Implement cost rate table and calculation
  - [ ] 16.1 Create cost rate table
    - Define `CostRate` interface with `input_per_1k_tokens` and `output_per_1k_tokens`
    - Define `CostRateTable` type as nested record of provider → model → CostRate
    - Define `DEFAULT_COST_RATES` constant with rates for OpenAI and Anthropic models
    - Create `src/persistence/cost-rates.ts`
    - _Requirements: 7.4_

  - [ ] 16.2 Implement cost calculation function
    - Implement `calculateCost(rates, provider, model, tokensIn, tokensOut)` function
    - Return 0 for unknown provider/model combinations
    - Create function in `src/persistence/cost-rates.ts`
    - _Requirements: 7.4_

  - [ ]* 16.3 Write property test for cost calculation correctness
    - **Property 12: Cost calculation correctness**
    - **Validates: Requirements 7.4**
    - Test that any token counts produce correct cost calculation using formula
    - _Requirements: 7.4_

  - [ ]* 16.4 Write unit tests for cost calculation
    - Test calculation with known rates and token counts
    - Test returns 0 for unknown provider/model
    - _Requirements: 7.4_

---

### Phase 7: Orchestrator

- [ ] 17. Implement Orchestrator
  - [ ] 17.1 Create Orchestrator class
    - Define `OrchestratorRequest` interface with `conversation_id`, `content`, `provider`, `model`, optional `temperature`, optional `max_tokens`
    - Define `OrchestratorResult` interface with `message` and `usage` fields
    - Implement constructor accepting ProviderRegistry, ContextEngine, HookSystem, repositories, and CostRateTable
    - Create `src/orchestrator/orchestrator.ts`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 17.2 Implement 7-step request lifecycle
    - Step 1: Load conversation history from MessageRepository
    - Step 2: Dispatch beforeRequest hooks with conversation context
    - Step 3: Invoke ContextEngine.buildContext with history and model
    - Step 4: Resolve provider from registry and call generateResponse
    - Step 5: Dispatch afterResponse hooks with LLMResponse and usage data
    - Step 6: Calculate cost and persist Message and UsageLog in same operation
    - Step 7: Return OrchestratorResult with message and usage summary
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ] 17.3 Implement error handling in orchestrator
    - Catch provider errors and dispatch onError hooks
    - Persist UsageLog with error_status for failed requests
    - Return structured error response without crashing
    - _Requirements: 5.5, 9.1, 9.2_

  - [ ]* 17.4 Write property test for universal UsageLog persistence
    - **Property 11: Universal UsageLog persistence**
    - **Validates: Requirements 7.1, 7.5, 7.6, 9.5**
    - Test that any request (success or failure) results in a UsageLog entry
    - _Requirements: 7.1, 7.5, 7.6_

  - [ ]* 17.5 Write unit tests for Orchestrator
    - Test 7-step lifecycle with mocked dependencies
    - Test step ordering is correct
    - Test error handling and onError hook dispatch
    - Test UsageLog persistence for both success and failure
    - Test cost calculation is applied
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 8: API Layer

- [ ] 19. Implement error handling utilities
  - [ ] 19.1 Create typed error classes
    - Define `PlatformError` base class with `error_code`, `message`, `statusCode`
    - Define `ValidationError`, `ProviderError`, `NotFoundError`, `DatabaseError` subclasses
    - Create `src/utils/errors.ts`
    - _Requirements: 9.1, 9.4_

  - [ ] 19.2 Create structured logger
    - Set up pino or winston with structured logging configuration
    - Create `src/utils/logger.ts`
    - _Requirements: 9.2_

- [ ] 20. Implement API request validation middleware
  - [ ] 20.1 Create validation middleware
    - Implement middleware that validates required fields are present and non-empty
    - Return HTTP 400 with descriptive error for missing/empty fields
    - Create `src/api/middleware/validate-request.ts`
    - _Requirements: 8.7, 8.8_

  - [ ]* 20.2 Write property test for API request validation completeness
    - **Property 13: API request validation completeness**
    - **Validates: Requirements 8.7, 8.8**
    - Test that any request with missing/empty required field returns HTTP 400 with field name
    - _Requirements: 8.7, 8.8_

- [ ] 21. Implement global error handler middleware
  - [ ] 21.1 Create error handler middleware
    - Catch all unhandled exceptions at API boundary
    - Dispatch onError hooks
    - Return structured JSON error response with appropriate HTTP status
    - Never expose raw stack traces in response
    - Create `src/api/middleware/error-handler.ts`
    - _Requirements: 8.6, 9.3, 9.4_

  - [ ]* 21.2 Write property test for API error response shape
    - **Property 14: API error response shape**
    - **Validates: Requirements 8.6, 9.1, 9.4**
    - Test that any error returns structured JSON with error_code and message, no stack trace
    - _Requirements: 8.6, 9.1, 9.4_

- [ ] 22. Implement conversation endpoints
  - [ ] 22.1 Create conversation handlers
    - Implement POST /conversations handler that creates new conversation
    - Implement GET /conversations/:id handler that retrieves conversation with messages
    - Return HTTP 404 for non-existent conversations
    - Create `src/api/handlers/conversations.ts`
    - _Requirements: 8.1, 8.2_

  - [ ]* 22.2 Write unit tests for conversation endpoints
    - Test POST /conversations creates conversation and returns 201
    - Test GET /conversations/:id returns conversation with messages
    - Test GET /conversations/:id returns 404 for non-existent id
    - _Requirements: 8.1, 8.2_

- [ ] 23. Implement message endpoint
  - [ ] 23.1 Create message handler
    - Implement POST /conversations/:id/messages handler
    - Validate request fields using validation middleware
    - Delegate to Orchestrator.process
    - Return assistant message and usage summary on success
    - Return structured error response on failure
    - Create `src/api/handlers/messages.ts`
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ]* 23.2 Write unit tests for message endpoint
    - Test POST /conversations/:id/messages returns assistant message and usage
    - Test validation errors return HTTP 400
    - Test orchestrator errors return appropriate HTTP status
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [ ] 24. Wire up API router and server
  - [ ] 24.1 Create API router
    - Define all routes with handlers and middleware
    - Apply validation middleware to message endpoint
    - Apply global error handler
    - Create `src/api/router.ts`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 24.2 Create application entry point
    - Load environment variables and configuration
    - Initialize database connection and run migrations
    - Create and register provider adapters (OpenAI, Anthropic)
    - Initialize ContextEngine with FIFO strategy and model token limits
    - Initialize HookSystem and register default hooks (logging)
    - Initialize repositories
    - Initialize Orchestrator with all dependencies
    - Initialize API router with handlers
    - Start Express/Fastify server
    - Create `src/index.ts`
    - _Requirements: 1.4, 3.9, 4.5, 6.8, 10.2, 10.3, 10.4_

  - [ ] 24.3 Create configuration module
    - Load environment variables for API keys, database URL, port
    - Validate required environment variables are present
    - Export MODEL_TOKEN_LIMITS constant
    - Create `src/config.ts`
    - _Requirements: 3.9_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 9: Integration and Final Validation

- [ ] 26. Write integration tests
  - [ ]* 26.1 Write end-to-end integration tests
    - Test full request flow: create conversation → send message → retrieve conversation
    - Test with mock provider adapters
    - Test with real SQLite in-memory database
    - Test error flows (provider failure, validation errors)
    - Test hook system integration
    - _Requirements: 5.1, 8.1, 8.2, 8.3_

- [ ] 27. Create README and documentation
  - Document API endpoints with request/response examples
  - Document environment variables required
  - Document how to run migrations
  - Document how to run tests
  - Document how to add new provider adapters
  - _Requirements: 10.4_

- [ ] 28. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit + property + integration)
  - Verify all 15 correctness properties pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate the 15 correctness properties defined in design.md
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation at major milestones
- The strict development order ensures each phase builds on completed foundations
