import type { HookEvent, HookFn } from '../types/hook';
/**
 * Pluggable lifecycle hook system.
 * Hooks are fire-and-forget — a throwing hook never interrupts the main pipeline.
 * Requirements: 6.1, 6.2, 6.3, 6.7, 6.8
 */
export declare class HookSystem {
    private hooks;
    /**
     * Registers a hook function for the given lifecycle event.
     * Multiple hooks per event are supported and invoked in registration order.
     * Requirements: 6.2, 6.8
     */
    registerHook(event: HookEvent, fn: HookFn): void;
    /**
     * Dispatches a lifecycle event, invoking all registered hooks in order.
     * Exceptions from individual hooks are caught and logged — never propagated.
     * Requirements: 6.3, 6.7
     */
    dispatch(event: HookEvent, context: unknown): Promise<void>;
}
//# sourceMappingURL=hook-system.d.ts.map