"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("./persistence/db");
const conversation_repository_impl_1 = require("./persistence/repositories/conversation-repository.impl");
const message_repository_impl_1 = require("./persistence/repositories/message-repository.impl");
const usage_log_repository_impl_1 = require("./persistence/repositories/usage-log-repository.impl");
const registry_1 = require("./providers/registry");
const openai_adapter_1 = require("./providers/openai-adapter");
const anthropic_adapter_1 = require("./providers/anthropic-adapter");
const context_engine_1 = require("./context-engine/context-engine");
const fifo_trim_1 = require("./context-engine/strategies/fifo-trim");
const hook_system_1 = require("./hooks/hook-system");
const orchestrator_1 = require("./orchestrator/orchestrator");
const router_1 = require("./api/router");
const cost_rates_1 = require("./persistence/cost-rates");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
async function main() {
    // Initialize database
    const db = await (0, db_1.initializeDatabase)();
    // Initialize repositories
    const conversationRepo = new conversation_repository_impl_1.SqliteConversationRepository(db);
    const messageRepo = new message_repository_impl_1.SqliteMessageRepository(db);
    const usageLogRepo = new usage_log_repository_impl_1.SqliteUsageLogRepository(db);
    // Initialize provider registry and register adapters
    const registry = new registry_1.ProviderRegistry();
    if (config_1.config.openaiApiKey) {
        const openaiClient = new openai_1.default({ apiKey: config_1.config.openaiApiKey });
        registry.register('openai', new openai_adapter_1.OpenAIAdapter(openaiClient));
        logger_1.logger.info('OpenAI provider registered');
    }
    if (config_1.config.anthropicApiKey) {
        const anthropicClient = new sdk_1.default({ apiKey: config_1.config.anthropicApiKey });
        registry.register('anthropic', new anthropic_adapter_1.AnthropicAdapter(anthropicClient));
        logger_1.logger.info('Anthropic provider registered');
    }
    // Initialize context engine with FIFO strategy
    const contextEngine = new context_engine_1.ContextEngine({
        trimStrategy: fifo_trim_1.fifoTrim,
        modelTokenLimits: config_1.MODEL_TOKEN_LIMITS,
    });
    // Initialize hook system with default logging hooks
    const hookSystem = new hook_system_1.HookSystem();
    hookSystem.registerHook('beforeRequest', (ctx) => {
        logger_1.logger.info({ event: 'beforeRequest', ctx }, 'Request starting');
    });
    hookSystem.registerHook('afterResponse', (ctx) => {
        logger_1.logger.info({ event: 'afterResponse', ctx }, 'Response received');
    });
    hookSystem.registerHook('onError', (ctx) => {
        logger_1.logger.error({ event: 'onError', ctx }, 'Error in pipeline');
    });
    // Initialize orchestrator
    const orchestrator = new orchestrator_1.Orchestrator(registry, contextEngine, hookSystem, { conversations: conversationRepo, messages: messageRepo, usageLogs: usageLogRepo }, cost_rates_1.DEFAULT_COST_RATES);
    // Wire up Express app
    const app = (0, express_1.default)();
    // CORS — allow mobile clients and local web dev
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
            return;
        }
        next();
    });
    app.use(express_1.default.json());
    app.use('/api', (0, router_1.createRouter)(orchestrator, conversationRepo, messageRepo, hookSystem));
    app.listen(config_1.config.port, () => {
        logger_1.logger.info({ port: config_1.config.port, env: config_1.config.nodeEnv }, 'Server started');
    });
}
main().catch((err) => {
    logger_1.logger.error({ err }, 'Fatal startup error');
    process.exit(1);
});
//# sourceMappingURL=index.js.map