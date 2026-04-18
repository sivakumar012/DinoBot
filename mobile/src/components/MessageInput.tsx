/**
 * MessageInput — the chat input bar.
 * Handles multi-line expansion, send on submit, disabled state when offline/pending.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Message…',
}: Props): React.JSX.Element {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.clear();
  }

  const canSend = text.trim().length > 0 && !disabled && !loading;

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, disabled && styles.inputRowDisabled]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDisabled}
          multiline
          maxLength={4000}
          returnKeyType={Platform.OS === 'ios' ? 'send' : 'default'}
          onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
          blurOnSubmit={Platform.OS === 'ios'}
          editable={!disabled && !loading}
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  inputRowDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? Spacing.xs : 0,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xs : 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  sendIcon: {
    color: Colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
