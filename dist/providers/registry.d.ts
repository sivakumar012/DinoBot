import type { Provider } from '../types/provider';
/**
 * Registry that maps provider name strings to Provider interface implementations.
 * Requirements: 1.4, 10.1, 10.4, 10.5
 */
export declare class ProviderRegistry {
    private adapters;
    /**
     * Registers a provider adapter under the given name.
     * Validates that the adapter satisfies the Provider interface at registration time.
     * Requirements: 1.4, 1.5
     */
    register(name: string, adapter: Provider): void;
    /**
     * Resolves a registered provider by name.
     * Throws if no provider is registered under that name.
     * Requirements: 10.5
     */
    resolve(name: string): Provider;
    /**
     * Returns the list of all registered provider names.
     */
    list(): string[];
}
//# sourceMappingURL=registry.d.ts.map