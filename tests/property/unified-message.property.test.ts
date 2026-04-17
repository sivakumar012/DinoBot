/**
 * Property-based tests for UnifiedMessage type invariants.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UnifiedMessage, MessageRole } from '../../src/types/unified-message';

const VALID_ROLES: MessageRole[] = ['system', 'user', 'assistant'];

// Arbitrary that generates valid UnifiedMessage objects
const validUnifiedMessage = fc.record({
  role: fc.constantFrom(...VALID_ROLES),
  content: fc.string(),
});

// Arbitrary that generates objects with invalid roles
const invalidRole = fc.string().filter((s) => !VALID_ROLES.includes(s as MessageRole));

describe('UnifiedMessage property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 1: UnifiedMessage role invariant
  it('any valid UnifiedMessage has role in {system, user, assistant} and content is a string', () => {
    fc.assert(
      fc.property(validUnifiedMessage, (msg: UnifiedMessage) => {
        expect(VALID_ROLES).toContain(msg.role);
        expect(typeof msg.content).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 1: UnifiedMessage role invariant
  it('a UnifiedMessage with a role outside the valid set is not a valid MessageRole', () => {
    fc.assert(
      fc.property(invalidRole, fc.string(), (role, content) => {
        const isValid = VALID_ROLES.includes(role as MessageRole);
        expect(isValid).toBe(false);
        // Constructing an object with an invalid role should not satisfy the type
        const msg = { role, content };
        expect(VALID_ROLES).not.toContain(msg.role);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 1: UnifiedMessage role invariant
  it('content field is always a string for any valid UnifiedMessage', () => {
    fc.assert(
      fc.property(validUnifiedMessage, (msg: UnifiedMessage) => {
        return typeof msg.content === 'string';
      }),
      { numRuns: 100 }
    );
  });
});
