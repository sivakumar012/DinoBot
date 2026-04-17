/**
 * Property-based tests for the Hook System.
 * Properties 9, 10.
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { HookSystem } from '../../src/hooks/hook-system';
import type { HookEvent } from '../../src/types/hook';

const HOOK_EVENTS: HookEvent[] = ['beforeRequest', 'afterResponse', 'onError'];

describe('Hook System property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 9: Hook invocation completeness and ordering
  it('all N registered hooks are invoked in registration order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        fc.constantFrom(...HOOK_EVENTS),
        async (n, event: HookEvent) => {
          const hookSystem = new HookSystem();
          const callOrder: number[] = [];

          for (let i = 0; i < n; i++) {
            const idx = i;
            hookSystem.registerHook(event, async () => {
              callOrder.push(idx);
            });
          }

          await hookSystem.dispatch(event, {});

          expect(callOrder).toHaveLength(n);
          for (let i = 0; i < n; i++) {
            expect(callOrder[i]).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 9: Hook invocation completeness and ordering
  it('each hook receives the exact context object passed to dispatch', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.constantFrom(...HOOK_EVENTS),
        fc.record({ id: fc.string(), value: fc.nat() }),
        async (n, event: HookEvent, context) => {
          const hookSystem = new HookSystem();
          const receivedContexts: unknown[] = [];

          for (let i = 0; i < n; i++) {
            hookSystem.registerHook(event, async (ctx) => {
              receivedContexts.push(ctx);
            });
          }

          await hookSystem.dispatch(event, context);

          expect(receivedContexts).toHaveLength(n);
          for (const received of receivedContexts) {
            expect(received).toEqual(context);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 10: Hook failure isolation
  it('a throwing hook does not prevent subsequent hooks from executing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.constantFrom(...HOOK_EVENTS),
        async (totalHooks, throwingIndex, event: HookEvent) => {
          const actualThrowingIndex = throwingIndex % totalHooks;
          const hookSystem = new HookSystem();
          const invoked: number[] = [];

          for (let i = 0; i < totalHooks; i++) {
            const idx = i;
            if (idx === actualThrowingIndex) {
              hookSystem.registerHook(event, async () => {
                invoked.push(idx);
                throw new Error(`Hook ${idx} failed`);
              });
            } else {
              hookSystem.registerHook(event, async () => {
                invoked.push(idx);
              });
            }
          }

          // dispatch must not throw even if a hook throws
          await expect(hookSystem.dispatch(event, {})).resolves.toBeUndefined();

          // All hooks must have been invoked
          expect(invoked).toHaveLength(totalHooks);
          for (let i = 0; i < totalHooks; i++) {
            expect(invoked).toContain(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 10: Hook failure isolation
  it('multiple throwing hooks do not propagate exceptions to the caller', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.constantFrom(...HOOK_EVENTS),
        async (n, event: HookEvent) => {
          const hookSystem = new HookSystem();

          // All hooks throw
          for (let i = 0; i < n; i++) {
            hookSystem.registerHook(event, async () => {
              throw new Error(`Hook ${i} always throws`);
            });
          }

          // Must resolve without throwing
          await expect(hookSystem.dispatch(event, {})).resolves.toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 9: Hook invocation completeness and ordering
  it('dispatching an event with no registered hooks resolves without error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...HOOK_EVENTS),
        async (event: HookEvent) => {
          const hookSystem = new HookSystem();
          await expect(hookSystem.dispatch(event, {})).resolves.toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
