"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDb = getDb;
exports._resetDb = _resetDb;
const sql_js_1 = __importDefault(require("sql.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let dbInstance = null;
/**
 * Initializes the SQLite (sql.js) in-memory database and runs migrations.
 * Uses a singleton pattern — subsequent calls return the same instance.
 */
async function initializeDatabase() {
    if (dbInstance !== null) {
        return dbInstance;
    }
    const SQL = await (0, sql_js_1.default)();
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
function getDb() {
    if (dbInstance === null) {
        throw new Error('Database has not been initialized. Call initializeDatabase() before getDb().');
    }
    return dbInstance;
}
/**
 * Resets the singleton — intended for use in tests only.
 */
function _resetDb() {
    if (dbInstance !== null) {
        dbInstance.close();
        dbInstance = null;
    }
}
//# sourceMappingURL=db.js.map