/**
 * HomeScreen — conversation list.
 * Shows all conversations with preview text and a "New Chat" FAB.
 * Handles offline state with OfflineBanner.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useChatStore } from '../store/chat.store';
import { useSettingsStore } from '../store/settings.store';
import { createConversation } from '../api/client';
import { OfflineBanner } from '../components/OfflineBanner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useNetInfo } from '../hooks/useNetInfo';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import uuid from 'react-native-uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const { conversations, addConversation, setActiveConversation } = useChatStore();
  const { userId, setUserId, selectedProvider } = useSettingsStore();
  const { isConnected } = useNetInfo();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure user has an ID
  useEffect(() => {
    if (!userId) {
      setUserId(uuid.v4() as string);
    }
  }, [userId, setUserId]);

  const handleNewChat = useCallback(async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please connect to the internet to start a new chat.');
      return;
    }
    if (!userId) return;

    setCreating(true);
    setError(null);
    try {
      const conv = await createConversation(userId);
      addConversation(conv);
      setActiveConversation(conv.id);
      navigation.navigate('Chat', { conversationId: conv.id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(msg);
    } finally {
      setCreating(false);
    }
  }, [isConnected, userId, addConversation, setActiveConversation, navigation]);

  function handleOpenConversation(id: string) {
    setActiveConversation(id);
    navigation.navigate('Chat', { conversationId: id });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Offline banner — store-compliance: every screen needs a no-connection state */}
      <OfflineBanner visible={!isConnected} />

      {/* Error banner */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Active model pill */}
      <View style={styles.modelPill}>
        <View
          style={[
            styles.modelDot,
            {
              backgroundColor:
                selectedProvider.provider === 'openai'
                  ? Colors.openai
                  : Colors.anthropic,
            },
          ]}
        />
        <Text style={styles.modelPillText}>{selectedProvider.label}</Text>
      </View>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyBody}>
            Tap the button below to start chatting with{' '}
            {selectedProvider.label}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convRow}
              onPress={() => handleOpenConversation(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open conversation: ${item.preview}`}
            >
              <View style={styles.convIcon}>
                <Text style={styles.convIconText}>💬</Text>
              </View>
              <View style={styles.convContent}>
                <Text style={styles.convPreview} numberOfLines={2}>
                  {item.preview}
                </Text>
                <Text style={styles.convDate}>
                  {formatDate(item.updated_at)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* FAB — New Chat */}
      <TouchableOpacity
        style={[styles.fab, (!isConnected || creating) && styles.fabDisabled]}
        onPress={handleNewChat}
        disabled={!isConnected || creating}
        accessibilityRole="button"
        accessibilityLabel="Start new chat"
      >
        {creating ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.fabText}>+ New Chat</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.h1, color: Colors.textPrimary },
  settingsIcon: { fontSize: 22 },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modelDot: { width: 8, height: 8, borderRadius: Radius.full },
  modelPillText: { ...Typography.caption, color: Colors.textSecondary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  separator: { height: Spacing.xs },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  convIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convIconText: { fontSize: 20 },
  convContent: { flex: 1 },
  convPreview: { ...Typography.body, color: Colors.textPrimary },
  convDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  chevron: { ...Typography.h2, color: Colors.textDisabled },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadow.md,
  },
  fabDisabled: { backgroundColor: Colors.textDisabled },
  fabText: { ...Typography.label, color: Colors.textOnPrimary },
});
