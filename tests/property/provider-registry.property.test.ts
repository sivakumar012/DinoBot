/**
 * Property-based tests for ProviderRegistry round-trip.
 * Property 15.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProviderRegistry } from '../../src/providers/registry';
import type { Provider, GenerateParams } from '../../src/types/provider';
import type { LLMResponse } from '../../src/types/llm-response';

// Factory for a minimal valid Provider implementation
function makeProvider(id: string): Provider {
  return {
    generateResponse: async (_params: GenerateParams): Promise<LLMResponse> => ({
      content: `response-from-${id}`,
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: 0,
      model: 'test',
    }),
  };
}

describe('ProviderRegistry property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 15: Provider registry round-trip
  it('any provider registered can be resolved to the exact same adapter instance', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
        (names) => {
          const uniqueNames = [...new Set(names)];
          const registry = new ProviderRegistry();
          const adapters = new Map<string, Provider>();

          for (const name of uniqueNames) {
            const adapter = makeProvider(name);
            adapters.set(name, adapter);
            registry.register(name, adapter);
          }

          for (const name of uniqueNames) {
            const resolved = registry.resolve(name);
            expect(resolved).toBe(adapters.get(name));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 15: Provider registry round-trip
  it('resolving an unregistered name always throws an error', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (registeredNames, unregisteredName) => {
          const uniqueRegistered = [...new Set(registeredNames)].filter(
            (n) => n !== unregisteredName
          );

          const registry = new ProviderRegistry();
          for (const name of uniqueRegistered) {
            registry.register(name, makeProvider(name));
          }

          expect(() => registry.resolve(unregisteredName)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 15: Provider registry round-trip
  it('list() returns all and only the registered provider names', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (names) => {
          const uniqueNames = [...new Set(names)];
          const registry = new ProviderRegistry();

          for (const name of uniqueNames) {
            registry.register(name, makeProvider(name));
          }

          const listed = registry.list();
          expect(listed.sort()).toEqual(uniqueNames.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 15: Provider registry round-trip
  it('registering an object without generateResponse throws at registration time', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (name) => {
          const registry = new ProviderRegistry();
          const invalidAdapter = { notGenerateResponse: () => {} };

          expect(() => registry.register(name, invalidAdapter as unknown as Provider)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
