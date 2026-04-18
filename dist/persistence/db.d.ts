import type { Database } from 'sql.js';
/**
 * Initializes the SQLite (sql.js) in-memory database and runs migrations.
 * Uses a singleton pattern — subsequent calls return the same instance.
 */
export declare function initializeDatabase(): Promise<Database>;
/**
 * Returns the initialized database instance.
 * Throws if `initializeDatabase()` has not been called yet.
 */
export declare function getDb(): Database;
/**
 * Resets the singleton — intended for use in tests only.
 */
export declare function _resetDb(): void;
//# sourceMappingURL=db.d.ts.map