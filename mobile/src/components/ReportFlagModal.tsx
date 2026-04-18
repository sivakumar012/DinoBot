/**
 * ReportFlagModal — lets users flag AI-generated content.
 *
 * Store-compliance requirement (Generative AI Safety, 2026 Mandate):
 * Apps using GenAI MUST include a "Report/Flag" mechanism for AI-generated content.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

export type FlagReason =
  | 'harmful'
  | 'inaccurate'
  | 'inappropriate'
  | 'privacy'
  | 'other';

const FLAG_REASONS: { value: FlagReason; label: string; emoji: string }[] = [
  { value: 'harmful', label: 'Harmful or dangerous', emoji: '⚠️' },
  { value: 'inaccurate', label: 'Factually incorrect', emoji: '❌' },
  { value: 'inappropriate', label: 'Inappropriate content', emoji: '🚫' },
  { value: 'privacy', label: 'Privacy concern', emoji: '🔒' },
  { value: 'other', label: 'Other', emoji: '💬' },
];

interface Props {
  visible: boolean;
  messageContent: string;
  onClose: () => void;
  onSubmit: (reason: FlagReason, details: string) => void;
}

export function ReportFlagModal({
  visible,
  messageContent,
  onClose,
  onSubmit,
}: Props): React.JSX.Element {
  const [selectedReason, setSelectedReason] = useState<FlagReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!selectedReason) return;
    onSubmit(selectedReason, details);
    setSubmitted(true);
  }

  function handleClose() {
    setSelectedReason(null);
    setDetails('');
    setSubmitted(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Report AI Response</Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close report dialog"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {submitted ? (
            // ── Thank-you state ──────────────────────────────────────────────
            <View style={styles.thankYou}>
              <Text style={styles.thankYouEmoji}>✅</Text>
              <Text style={styles.thankYouTitle}>Report submitted</Text>
              <Text style={styles.thankYouBody}>
                Thank you for helping keep this app safe. We'll review this response.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── Report form ──────────────────────────────────────────────────
            <View style={styles.body}>
              {/* Quoted message preview */}
              <View style={styles.quoteBox}>
                <Text style={styles.quoteLabel}>Flagging response:</Text>
                <Text style={styles.quoteText} numberOfLines={3}>
                  {messageContent}
                </Text>
              </View>

              {/* Reason selection */}
              <Text style={styles.sectionLabel}>What's the issue?</Text>
              {FLAG_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.reasonRow,
                    selectedReason === r.value && styles.reasonRowSelected,
                  ]}
                  onPress={() => setSelectedReason(r.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedReason === r.value }}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === r.value && styles.reasonLabelSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                  {selectedReason === r.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* Optional details */}
              <Text style={styles.sectionLabel}>Additional details (optional)</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="Describe the issue..."
                placeholderTextColor={Colors.textDisabled}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                maxLength={500}
                accessibilityLabel="Additional details about the report"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !selectedReason && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
              >
                <Text style={styles.submitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { ...Typography.h3, color: Colors.textPrimary },
  closeBtn: { ...Typography.h3, color: Colors.textSecondary },
  body: { padding: Spacing.md, flex: 1 },
  quoteBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  quoteLabel: { ...Typography.caption, color: Colors.primary, marginBottom: 2 },
  quoteText: { ...Typography.bodySmall, color: Colors.textSecondary },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  reasonRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  reasonEmoji: { fontSize: 18 },
  reasonLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  reasonLabelSelected: { color: Colors.primary, fontWeight: '600' },
  checkmark: { color: Colors.primary, fontWeight: '700' },
  detailsInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  submitButtonDisabled: { backgroundColor: Colors.textDisabled },
  submitText: { ...Typography.label, color: Colors.textOnPrimary },
  thankYou: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  thankYouEmoji: { fontSize: 56, marginBottom: Spacing.md },
  thankYouTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  thankYouBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  doneText: { ...Typography.label, color: Colors.textOnPrimary },
});
