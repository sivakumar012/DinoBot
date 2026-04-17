import type { Provider } from '../types/provider';

/**
 * Registry that maps provider name strings to Provider interface implementations.
 * Requirements: 1.4, 10.1, 10.4, 10.5
 */
export class ProviderRegistry {
  private adapters = new Map<string, Provider>();

  /**
   * Registers a provider adapter under the given name.
   * Validates that the adapter satisfies the Provider interface at registration time.
   * Requirements: 1.4, 1.5
   */
  register(name: string, adapter: Provider): void {
    if (typeof adapter?.generateResponse !== 'function') {
      throw new Error(
        `Provider "${name}" does not implement required generateResponse method`
      );
    }
    this.adapters.set(name, adapter);
  }

  /**
   * Resolves a registered provider by name.
   * Throws if no provider is registered under that name.
   * Requirements: 10.5
   */
  resolve(name: string): Provider {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`No provider registered with name "${name}"`);
    }
    return adapter;
  }

  /**
   * Returns the list of all registered provider names.
   */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }
}
