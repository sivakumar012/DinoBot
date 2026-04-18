import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

let dbInstance: Database | null = null;

/**
 * Initializes the SQLite (sql.js) in-memory database and runs migrations.
 * Uses a singleton pattern — subsequent calls return the same instance.
 */
export async function initializeDatabase(): Promise<Database> {
  if (dbInstance !== null) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Run the initial migration
  // __dirname resolves to dist/persistence in production, src/persistence in dev
  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  db.run(migrationSql);

  dbInstance = db;
  return db;
}

/**
 * Returns the initialized database instance.
 * Throws if `initializeDatabase()` has not been called yet.
 */
export function getDb(): Database {
  if (dbInstance === null) {
    throw new Error(
      'Database has not been initialized. Call initializeDatabase() before getDb().'
    );
  }
  return dbInstance;
}

/**
 * Resets the singleton — intended for use in tests only.
 */
export function _resetDb(): void {
  if (dbInstance !== null) {
    dbInstance.close();
    dbInstance = null;
  }
}
