# Testing Standards

## Test Framework

- **Runner**: Vitest 3.x (`vitest.config.ts` at root)
- **PBT library**: fast-check 3.x
- **Commands**: `npm test` (all), `npm run test:unit`, `npm run test:property`

## Test File Locations

```
tests/
├── unit/
│   ├── api/conversations.test.ts
│   ├── api/messages.test.ts
│   ├── orchestrator/orchestrator.test.ts
│   ├── context-engine/context-engine.test.ts
│   ├── hooks/hook-system.test.ts
│   └── persistence/repositories.test.ts
└── property/
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

## Property-Based Test Rules

Every property test **must** include this tag comment on the line above the `it()`:

```typescript
// Feature: multi-llm-orchestration-platform, Property N: <property_text>
it("...", () => {
  fc.assert(fc.property(...), { numRuns: 100 });
});
```

Minimum **100 runs** per property (`numRuns: 100`). Never lower this.

The 15 correctness properties are defined in `.kiro/specs/multi-llm-orchestration-platform/design.md`. Each property test maps 1:1 to a numbered property in that document.

## Unit Test Rules

- Mock all external dependencies (database, LLM API clients, hooks) using Vitest's `vi.fn()` / `vi.spyOn()`.
- Test the Orchestrator's 7-step ordering by verifying mock call sequence.
- Test error boundaries: every error path must have a corresponding test.
- Use an in-memory SQLite database (sql.js) for repository tests — never mock the DB layer in repository tests.

## What Is Not Property-Tested (use example-based tests instead)

- API endpoint existence and routing
- Orchestrator step ordering (mock call tracking)
- Environment variable loading
- Code structure constraints

## Error Path Coverage Requirements

Every module that can throw must have tests for:
1. The happy path
2. The error path (what the caller receives when it fails)
3. That errors do not propagate as unhandled exceptions past the module boundary

## Integration Tests

Located in `tests/unit/` alongside unit tests, tagged with `// integration` comment.

- Use real SQLite in-memory database
- Use mock HTTP clients for LLM providers (never call real APIs in tests)
- Use `supertest` for API endpoint testing if added as a dev dependency
