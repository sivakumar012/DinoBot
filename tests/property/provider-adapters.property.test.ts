/**
 * Property-based tests for provider adapter behaviors.
 * Properties 3, 4, 5.
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { UnifiedMessage } from '../../src/types/unified-message';
import { OpenAIAdapter } from '../../src/providers/openai-adapter';
import { AnthropicAdapter } from '../../src/providers/anthropic-adapter';

// Arbitrary for a valid UnifiedMessage
const unifiedMessage = (role: 'system' | 'user' | 'assistant' = 'user') =>
  fc.record({
    role: fc.constant(role),
    content: fc.string({ minLength: 1 }),
  });

const anyMessage = fc.oneof(
  unifiedMessage('system'),
  unifiedMessage('user'),
  unifiedMessage('assistant')
);

// Arbitrary for a non-empty array of messages (no system)
const conversationMessages = fc
  .array(fc.oneof(unifiedMessage('user'), unifiedMessage('assistant')), {
    minLength: 1,
    maxLength: 10,
  });

// Arbitrary for messages that may include a system message
const messagesWithOptionalSystem = fc.tuple(
  fc.boolean(),
  conversationMessages
).map(([hasSystem, msgs]) => {
  if (hasSystem) {
    return [{ role: 'system' as const, content: 'You are a helpful assistant.' }, ...msgs];
  }
  return msgs;
});

describe('Provider adapter property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 3: Provider adapter error isolation
  it('OpenAI adapter catches any thrown error and returns LLMResponse with error field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        conversationMessages,
        async (errorMessage, messages) => {
          const mockClient = {
            chat: {
              completions: {
                create: vi.fn().mockRejectedValue(new Error(errorMessage)),
              },
            },
          };

          const adapter = new OpenAIAdapter(mockClient as never);
          const response = await adapter.generateResponse({
            model: 'gpt-4o',
            messages,
          });

          // Must return a valid LLMResponse — never throw
          expect(typeof response.content).toBe('string');
          expect(typeof response.tokens_in).toBe('number');
          expect(typeof response.tokens_out).toBe('number');
          expect(typeof response.latency_ms).toBe('number');
          expect(typeof response.model).toBe('string');
          expect(response.error).toBeDefined();
          expect(response.error!.error_code).toBe('OPENAI_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 3: Provider adapter error isolation
  it('Anthropic adapter catches any thrown error and returns LLMResponse with error field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        conversationMessages,
        async (errorMessage, messages) => {
          const mockClient = {
            messages: {
              create: vi.fn().mockRejectedValue(new Error(errorMessage)),
            },
          };

          const adapter = new AnthropicAdapter(mockClient as never);
          const response = await adapter.generateResponse({
            model: 'claude-3-5-sonnet-20241022',
            messages,
          });

          expect(typeof response.content).toBe('string');
          expect(typeof response.tokens_in).toBe('number');
          expect(typeof response.tokens_out).toBe('number');
          expect(typeof response.latency_ms).toBe('number');
          expect(typeof response.model).toBe('string');
          expect(response.error).toBeDefined();
          expect(response.error!.error_code).toBe('ANTHROPIC_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 4: OpenAI message format conversion preserves content
  it('OpenAI adapter forwards messages preserving role and content in order', async () => {
    await fc.assert(
      fc.asyncProperty(conversationMessages, async (messages: UnifiedMessage[]) => {
        let capturedMessages: unknown[] = [];

        const mockClient = {
          chat: {
            completions: {
              create: vi.fn().mockImplementation((params: { messages: unknown[] }) => {
                capturedMessages = params.messages;
                return Promise.resolve({
                  choices: [{ message: { content: 'ok' } }],
                  usage: { prompt_tokens: 10, completion_tokens: 5 },
                });
              }),
            },
          },
        };

        const adapter = new OpenAIAdapter(mockClient as never);
        await adapter.generateResponse({ model: 'gpt-4o', messages });

        // Every message must be forwarded with same role and content, in order
        expect(capturedMessages).toHaveLength(messages.length);
        for (let i = 0; i < messages.length; i++) {
          const sent = capturedMessages[i] as { role: string; content: string };
          expect(sent.role).toBe(messages[i].role);
          expect(sent.content).toBe(messages[i].content);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 5: Anthropic system message separation
  it('Anthropic adapter extracts system message to system param and keeps only user/assistant in messages', async () => {
    await fc.assert(
      fc.asyncProperty(messagesWithOptionalSystem, async (messages: UnifiedMessage[]) => {
        let capturedParams: { system?: string; messages: { role: string }[] } = {
          messages: [],
        };

        const mockClient = {
          messages: {
            create: vi.fn().mockImplementation((params: typeof capturedParams) => {
              capturedParams = params;
              return Promise.resolve({
                content: [{ type: 'text', text: 'ok' }],
                usage: { input_tokens: 10, output_tokens: 5 },
              });
            }),
          },
        };

        const adapter = new AnthropicAdapter(mockClient as never);
        await adapter.generateResponse({
          model: 'claude-3-5-sonnet-20241022',
          messages,
        });

        const systemMsg = messages.find((m) => m.role === 'system');
        const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

        if (systemMsg) {
          // System message must be extracted to the system param
          expect(capturedParams.system).toBe(systemMsg.content);
        } else {
          // No system message — system param must be absent
          expect(capturedParams.system).toBeUndefined();
        }

        // messages array must contain only user/assistant roles
        for (const msg of capturedParams.messages) {
          expect(['user', 'assistant']).toContain(msg.role);
        }

        // Count must match non-system messages
        expect(capturedParams.messages).toHaveLength(nonSystemMsgs.length);
      }),
      { numRuns: 100 }
    );
  });
});
