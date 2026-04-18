import express from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { initializeDatabase } from './persistence/db';
import { SqliteConversationRepository } from './persistence/repositories/conversation-repository.impl';
import { SqliteMessageRepository } from './persistence/repositories/message-repository.impl';
import { SqliteUsageLogRepository } from './persistence/repositories/usage-log-repository.impl';
import { ProviderRegistry } from './providers/registry';
import { OpenAIAdapter } from './providers/openai-adapter';
import { AnthropicAdapter } from './providers/anthropic-adapter';
import { ContextEngine } from './context-engine/context-engine';
import { fifoTrim } from './context-engine/strategies/fifo-trim';
import { HookSystem } from './hooks/hook-system';
import { Orchestrator } from './orchestrator/orchestrator';
import { createRouter } from './api/router';
import { DEFAULT_COST_RATES } from './persistence/cost-rates';
import { MODEL_TOKEN_LIMITS, config } from './config';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  // Initialize database
  const db = await initializeDatabase();

  // Initialize repositories
  const conversationRepo = new SqliteConversationRepository(db);
  const messageRepo = new SqliteMessageRepository(db);
  const usageLogRepo = new SqliteUsageLogRepository(db);

  // Initialize provider registry and register adapters
  const registry = new ProviderRegistry();

  if (config.openaiApiKey) {
    const openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    registry.register('openai', new OpenAIAdapter(openaiClient));
    logger.info('OpenAI provider registered');
  }

  if (config.anthropicApiKey) {
    const anthropicClient = new Anthropic({ apiKey: config.anthropicApiKey });
    registry.register('anthropic', new AnthropicAdapter(anthropicClient));
    logger.info('Anthropic provider registered');
  }

  // Initialize context engine with FIFO strategy
  const contextEngine = new ContextEngine({
    trimStrategy: fifoTrim,
    modelTokenLimits: MODEL_TOKEN_LIMITS,
  });

  // Initialize hook system with default logging hooks
  const hookSystem = new HookSystem();

  hookSystem.registerHook('beforeRequest', (ctx) => {
    logger.info({ event: 'beforeRequest', ctx }, 'Request starting');
  });

  hookSystem.registerHook('afterResponse', (ctx) => {
    logger.info({ event: 'afterResponse', ctx }, 'Response received');
  });

  hookSystem.registerHook('onError', (ctx) => {
    logger.error({ event: 'onError', ctx }, 'Error in pipeline');
  });

  // Initialize orchestrator
  const orchestrator = new Orchestrator(
    registry,
    contextEngine,
    hookSystem,
    { conversations: conversationRepo, messages: messageRepo, usageLogs: usageLogRepo },
    DEFAULT_COST_RATES
  );

  // Wire up Express app
  const app = express();

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

  app.use(express.json());

  // Health check — required by Railway, Render, Fly.io
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', createRouter(orchestrator, conversationRepo, messageRepo, hookSystem));

  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
