/**
 * ChatScreen — the main conversation view.
 *
 * Features:
 * - Loads conversation history on mount
 * - Optimistic message rendering
 * - Provider/model picker in header
 * - Offline banner
 * - Flag/report on every assistant message
 * - Usage badge per response
 * - Keyboard-aware layout
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useChatStore, type LocalMessage } from '../store/chat.store';
import { useSettingsStore } from '../store/settings.store';
import {
  getConversation,
  sendMessage,
  flagMessage,
  ApiClientError,
} from '../api/client';import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { OfflineBanner } from '../components/OfflineBanner';
import { ErrorBanner } from '../components/ErrorBanner';
import { ProviderPicker } from '../components/ProviderPicker';
import type { FlagReason } from '../components/ReportFlagModal';
import { useNetInfo } from '../hooks/useNetInfo';
import { Colors, Spacing, Radius, Typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props): React.JSX.Element {
  const { conversationId } = route.params;
  const { conversations, setMessages, addOptimisticMessage, resolveMessage, markMessageError } =
    useChatStore();
  const { selectedProvider } = useSettingsStore();
  const { isConnected } = useNetInfo();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = conversation?.messages ?? [];

  // Load conversation history on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getConversation(conversationId);
        if (!cancelled) {
          const localMessages: LocalMessage[] = data.messages.map((m) => ({
            ...m,
            isPending: false,
          }));
          setMessages(conversationId, localMessages);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiClientError
              ? err.apiError.message
              : 'Failed to load conversation';
          setError(msg);
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [conversationId, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!isConnected) {
        setError('No internet connection. Please reconnect and try again.');
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();

      // Optimistic user message
      const optimisticUser: LocalMessage = {
        id: tempId,
        conversation_id: conversationId,
        role: 'user',
        content,
        model_used: null,
        token_count: null,
        created_at: now,
        isPending: false,
      };

      // Pending assistant placeholder
      const pendingAssistant: LocalMessage = {
        id: `${tempId}-assistant`,
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        model_used: selectedProvider.model,
        token_count: null,
        created_at: now,
        isPending: true,
      };

      addOptimisticMessage(conversationId, optimisticUser);
      addOptimisticMessage(conversationId, pendingAssistant);
      setLoading(true);
      setError(null);

      try {
        const result = await sendMessage({
          conversationId,
          content,
          provider: selectedProvider.provider,
          model: selectedProvider.model,
        });

        const resolvedUser: LocalMessage = {
          ...optimisticUser,
          id: tempId, // will be replaced by real id on next load
        };

        const resolvedAssistant: LocalMessage = {
          id: result.message.id,
          conversation_id: conversationId,
          role: 'assistant',
          content: result.message.content,
          model_used: result.message.model_used,
          token_count: null,
          created_at: result.message.created_at,
          isPending: false,
          usage: result.usage,
        };

        // Replace pending assistant placeholder
        resolveMessage(
          conversationId,
          `${tempId}-assistant`,
          resolvedAssistant,
          resolvedUser,
        );
      } catch (err) {
        const msg =
          err instanceof ApiClientError
            ? err.apiError.message
            : err instanceof Error
            ? err.message
            : 'Failed to send message';
        markMessageError(conversationId, `${tempId}-assistant`, msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [
      isConnected,
      conversationId,
      selectedProvider,
      addOptimisticMessage,
      resolveMessage,
      markMessageError,
    ],
  );

  function handleFlag(messageId: string, reason: FlagReason, details: string) {
    flagMessage({
      messageId,
      conversationId,
      reason,
      details,
    }).catch(() => {
      // Best-effort — flag failures are non-critical
    });
  }

  const providerColor =
    selectedProvider.provider === 'openai' ? Colors.openai : Colors.anthropic;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modelButton}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current model: ${selectedProvider.label}. Tap to change.`}
        >
          <View style={[styles.modelDot, { backgroundColor: providerColor }]} />
          <Text style={styles.modelLabel}>{selectedProvider.label}</Text>
          <Text style={styles.modelChevron}>⌄</Text>
        </TouchableOpacity>

        <View style={styles.headerRight} />
      </View>

      {/* Offline banner */}
      <OfflineBanner visible={!isConnected} />

      {/* Error banner */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {initialLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading conversation…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyBody}>
              Send a message to {selectedProvider.label} below.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onFlag={handleFlag} />
            )}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          disabled={!isConnected || initialLoading}
          loading={loading}
          placeholder={
            isConnected
              ? `Message ${selectedProvider.label}…`
              : 'No connection…'
          }
        />
      </KeyboardAvoidingView>

      {/* Provider picker */}
      <ProviderPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { fontSize: 28, color: Colors.primary, lineHeight: 32 },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  modelDot: { width: 8, height: 8, borderRadius: Radius.full },
  modelLabel: { ...Typography.label, color: Colors.primary },
  modelChevron: { color: Colors.primary, fontSize: 12 },
  headerRight: { width: 32 },
  messageList: { paddingVertical: Spacing.sm, paddingBottom: Spacing.md },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
