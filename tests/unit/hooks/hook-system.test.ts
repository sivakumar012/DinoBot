/**
 * Unit tests for HookSystem.
 */
import { describe, it, expect, vi } from 'vitest';
import { HookSystem } from '../../../src/hooks/hook-system';

describe('HookSystem', () => {
  describe('registerHook', () => {
    it('registers a hook for an event', async () => {
      const hookSystem = new HookSystem();
      const fn = vi.fn();
      hookSystem.registerHook('beforeRequest', fn);
      await hookSystem.dispatch('beforeRequest', {});
      expect(fn).toHaveBeenCalledOnce();
    });

    it('supports multiple hooks for the same event', async () => {
      const hookSystem = new HookSystem();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      hookSystem.registerHook('beforeRequest', fn1);
      hookSystem.registerHook('beforeRequest', fn2);
      await hookSystem.dispatch('beforeRequest', {});
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('hooks for different events are independent', async () => {
      const hookSystem = new HookSystem();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      hookSystem.registerHook('beforeRequest', fn1);
      hookSystem.registerHook('afterResponse', fn2);
      await hookSystem.dispatch('beforeRequest', {});
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('invokes hooks in registration order', async () => {
      const hookSystem = new HookSystem();
      const order: number[] = [];
      hookSystem.registerHook('beforeRequest', async () => { order.push(1); });
      hookSystem.registerHook('beforeRequest', async () => { order.push(2); });
      hookSystem.registerHook('beforeRequest', async () => { order.push(3); });
      await hookSystem.dispatch('beforeRequest', {});
      expect(order).toEqual([1, 2, 3]);
    });

    it('passes the context object to each hook', async () => {
      const hookSystem = new HookSystem();
      const received: unknown[] = [];
      hookSystem.registerHook('afterResponse', async (ctx) => { received.push(ctx); });
      hookSystem.registerHook('afterResponse', async (ctx) => { received.push(ctx); });
      const context = { foo: 'bar' };
      await hookSystem.dispatch('afterResponse', context);
      expect(received[0]).toBe(context);
      expect(received[1]).toBe(context);
    });

    it('resolves without error when no hooks are registered', async () => {
      const hookSystem = new HookSystem();
      await expect(hookSystem.dispatch('onError', {})).resolves.toBeUndefined();
    });

    it('catches and does not propagate exceptions from a throwing hook', async () => {
      const hookSystem = new HookSystem();
      hookSystem.registerHook('beforeRequest', async () => {
        throw new Error('hook error');
      });
      await expect(hookSystem.dispatch('beforeRequest', {})).resolves.toBeUndefined();
    });

    it('continues invoking subsequent hooks after one throws', async () => {
      const hookSystem = new HookSystem();
      const fn2 = vi.fn();
      hookSystem.registerHook('beforeRequest', async () => { throw new Error('fail'); });
      hookSystem.registerHook('beforeRequest', fn2);
      await hookSystem.dispatch('beforeRequest', {});
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('supports async hooks', async () => {
      const hookSystem = new HookSystem();
      let resolved = false;
      hookSystem.registerHook('afterResponse', async () => {
        await new Promise((r) => setTimeout(r, 1));
        resolved = true;
      });
      await hookSystem.dispatch('afterResponse', {});
      expect(resolved).toBe(true);
    });
  });

  describe('error path', () => {
    it('all hooks are still invoked even if every hook throws', async () => {
      const hookSystem = new HookSystem();
      const invoked: number[] = [];
      for (let i = 0; i < 5; i++) {
        const idx = i;
        hookSystem.registerHook('onError', async () => {
          invoked.push(idx);
          throw new Error(`hook ${idx} failed`);
        });
      }
      await expect(hookSystem.dispatch('onError', {})).resolves.toBeUndefined();
      expect(invoked).toHaveLength(5);
    });
  });
});
