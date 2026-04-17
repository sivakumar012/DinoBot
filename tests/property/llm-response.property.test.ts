/**
 * Property-based tests for LLMResponse structural completeness.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { LLMResponse } from '../../src/types/llm-response';

// Arbitrary for a valid LLMResponse (success)
const validLLMResponse = fc.record({
  content: fc.string(),
  tokens_in: fc.nat(),
  tokens_out: fc.nat(),
  latency_ms: fc.nat(),
  model: fc.string({ minLength: 1 }),
});

// Arbitrary for a valid LLMResponse with error
const errorLLMResponse = fc.record({
  content: fc.constant(''),
  tokens_in: fc.nat(),
  tokens_out: fc.nat(),
  latency_ms: fc.nat(),
  model: fc.string({ minLength: 1 }),
  error: fc.record({
    error_code: fc.string({ minLength: 1 }),
    message: fc.string({ minLength: 1 }),
  }),
});

function hasAllRequiredFields(response: LLMResponse): boolean {
  return (
    typeof response.content === 'string' &&
    typeof response.tokens_in === 'number' &&
    typeof response.tokens_out === 'number' &&
    typeof response.latency_ms === 'number' &&
    typeof response.model === 'string'
  );
}

describe('LLMResponse property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 2: LLMResponse structural completeness
  it('any successful LLMResponse contains all five required fields with correct types', () => {
    fc.assert(
      fc.property(validLLMResponse, (response: LLMResponse) => {
        expect(hasAllRequiredFields(response)).toBe(true);
        expect(response.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 2: LLMResponse structural completeness
  it('any error LLMResponse also contains all five required fields', () => {
    fc.assert(
      fc.property(errorLLMResponse, (response: LLMResponse) => {
        expect(hasAllRequiredFields(response)).toBe(true);
        expect(response.error).toBeDefined();
        expect(typeof response.error!.error_code).toBe('string');
        expect(typeof response.error!.message).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 2: LLMResponse structural completeness
  it('tokens_in and tokens_out are always non-negative numbers', () => {
    fc.assert(
      fc.property(
        fc.oneof(validLLMResponse, errorLLMResponse),
        (response: LLMResponse) => {
          return response.tokens_in >= 0 && response.tokens_out >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 2: LLMResponse structural completeness
  it('latency_ms is always a non-negative number', () => {
    fc.assert(
      fc.property(
        fc.oneof(validLLMResponse, errorLLMResponse),
        (response: LLMResponse) => {
          return response.latency_ms >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
