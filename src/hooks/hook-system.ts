import type { HookEvent, HookFn } from '../types/hook';
import { logger } from '../utils/logger';

/**
 * Pluggable lifecycle hook system.
 * Hooks are fire-and-forget — a throwing hook never interrupts the main pipeline.
 * Requirements: 6.1, 6.2, 6.3, 6.7, 6.8
 */
export class HookSystem {
  private hooks = new Map<HookEvent, HookFn[]>();

  /**
   * Registers a hook function for the given lifecycle event.
   * Multiple hooks per event are supported and invoked in registration order.
   * Requirements: 6.2, 6.8
   */
  registerHook(event: HookEvent, fn: HookFn): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(fn);
  }

  /**
   * Dispatches a lifecycle event, invoking all registered hooks in order.
   * Exceptions from individual hooks are caught and logged — never propagated.
   * Requirements: 6.3, 6.7
   */
  async dispatch(event: HookEvent, context: unknown): Promise<void> {
    const fns = this.hooks.get(event) ?? [];
    for (const fn of fns) {
      try {
        await fn(context);
      } catch (err) {
        logger.error({ event, err }, 'Hook threw an exception');
      }
    }
  }
}
