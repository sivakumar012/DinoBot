/**
 * MessageBubble — renders a single chat message.
 *
 * Features:
 * - User vs assistant visual distinction
 * - Pending/typing indicator
 * - Error state with retry hint
 * - Usage badge on assistant messages
 * - 🚩 Flag button on assistant messages (store-compliance: GenAI safety)
 * - Fallback UI for empty content (store-compliance: asset integrity)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { LocalMessage } from '../store/chat.store';
import { UsageBadge } from './UsageBadge';
import { ReportFlagModal } from './ReportFlagModal';
import type { FlagReason } from './ReportFlagModal';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { useStreamingDots } from '../hooks/useStreamingDots';

interface Props {
  message: LocalMessage;
  onFlag?: (messageId: string, reason: FlagReason, details: string) => void;
}

export function MessageBubble({ message, onFlag }: Props): React.JSX.Element {
  const [flagModalVisible, setFlagModalVisible] = useState(false);
  const dots = useStreamingDots(!!message.isPending);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  function handleFlagSubmit(reason: FlagReason, details: string) {
    onFlag?.(message.id, reason, details);
    setFlagModalVisible(false);
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}

      <View style={styles.bubbleWrap}>
        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
            message.error ? styles.bubbleError : null,
          ]}
          accessibilityRole="text"
          accessibilityLabel={`${isUser ? 'You' : 'Assistant'}: ${message.content || 'Loading'}`}
        >
          {message.isPending ? (
            // Typing indicator
            <View style={styles.pendingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.pendingText}>Thinking{dots}</Text>
            </View>
          ) : message.error ? (
            // Error state — never show blank
            <Text style={styles.errorText}>
              ⚠️ {message.error}
            </Text>
          ) : (
            // Content — fallback to placeholder if somehow empty
            <Text
              style={[
                styles.content,
                isUser ? styles.contentUser : styles.contentAssistant,
              ]}
              selectable
            >
              {message.content.trim() || '(No response received)'}
            </Text>
          )}
        </View>

        {/* Usage badge + flag button row */}
        {isAssistant && !message.isPending && !message.error && (
          <View style={styles.metaRow}>
            {message.usage && <UsageBadge usage={message.usage} />}
            <TouchableOpacity
              style={styles.flagButton}
              onPress={() => setFlagModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Flag this AI response"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.flagIcon}>🚩</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : null]}>
          {formatTime(message.created_at)}
          {message.model_used ? ` · ${message.model_used}` : ''}
        </Text>
      </View>

      {/* User avatar */}
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}

      {/* Flag modal */}
      <ReportFlagModal
        visible={flagModalVisible}
        messageContent={message.content}
        onClose={() => setFlagModalVisible(false)}
        onSubmit={handleFlagSubmit}
      />
    </View>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: { backgroundColor: Colors.border },
  avatarText: { fontSize: 16 },

  bubbleWrap: { maxWidth: '75%' },

  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.bubbleUser,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: Colors.bubbleAssistant,
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleError: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 1,
  },

  content: { ...Typography.body },
  contentUser: { color: Colors.bubbleUserText },
  contentAssistant: { color: Colors.bubbleAssistantText },

  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  pendingText: { ...Typography.body, color: Colors.textSecondary },

  errorText: { ...Typography.body, color: Colors.error },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  flagButton: { marginLeft: Spacing.sm },
  flagIcon: { fontSize: 14 },

  timestamp: {
    ...Typography.caption,
    color: Colors.textDisabled,
    marginTop: 2,
    textAlign: 'right',
  },
  timestampUser: { textAlign: 'right' },
});
