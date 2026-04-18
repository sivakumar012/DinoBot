"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
/**
 * Registry that maps provider name strings to Provider interface implementations.
 * Requirements: 1.4, 10.1, 10.4, 10.5
 */
class ProviderRegistry {
    adapters = new Map();
    /**
     * Registers a provider adapter under the given name.
     * Validates that the adapter satisfies the Provider interface at registration time.
     * Requirements: 1.4, 1.5
     */
    register(name, adapter) {
        if (typeof adapter?.generateResponse !== 'function') {
            throw new Error(`Provider "${name}" does not implement required generateResponse method`);
        }
        this.adapters.set(name, adapter);
    }
    /**
     * Resolves a registered provider by name.
     * Throws if no provider is registered under that name.
     * Requirements: 10.5
     */
    resolve(name) {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new Error(`No provider registered with name "${name}"`);
        }
        return adapter;
    }
    /**
     * Returns the list of all registered provider names.
     */
    list() {
        return Array.from(this.adapters.keys());
    }
}
exports.ProviderRegistry = ProviderRegistry;
//# sourceMappingURL=registry.js.map