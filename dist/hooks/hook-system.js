"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookSystem = void 0;
const logger_1 = require("../utils/logger");
/**
 * Pluggable lifecycle hook system.
 * Hooks are fire-and-forget — a throwing hook never interrupts the main pipeline.
 * Requirements: 6.1, 6.2, 6.3, 6.7, 6.8
 */
class HookSystem {
    hooks = new Map();
    /**
     * Registers a hook function for the given lifecycle event.
     * Multiple hooks per event are supported and invoked in registration order.
     * Requirements: 6.2, 6.8
     */
    registerHook(event, fn) {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        this.hooks.get(event).push(fn);
    }
    /**
     * Dispatches a lifecycle event, invoking all registered hooks in order.
     * Exceptions from individual hooks are caught and logged — never propagated.
     * Requirements: 6.3, 6.7
     */
    async dispatch(event, context) {
        const fns = this.hooks.get(event) ?? [];
        for (const fn of fns) {
            try {
                await fn(context);
            }
            catch (err) {
                logger_1.logger.error({ event, err }, 'Hook threw an exception');
            }
        }
    }
}
exports.HookSystem = HookSystem;
//# sourceMappingURL=hook-system.js.map