/**
 * ProviderPicker — bottom sheet style picker for selecting provider + model.
 * Shown in the chat header and settings screen.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {
  PROVIDER_OPTIONS,
  useSettingsStore,
  type ProviderOption,
} from '../store/settings.store';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ProviderPicker({ visible, onClose }: Props): React.JSX.Element {
  const { selectedProvider, setSelectedProvider } = useSettingsStore();
  const [hovered, setHovered] = useState<string | null>(null);

  function handleSelect(option: ProviderOption) {
    setSelectedProvider(option);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Model</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close model picker"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={PROVIDER_OPTIONS}
          keyExtractor={(item) => `${item.provider}-${item.model}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isSelected =
              selectedProvider.provider === item.provider &&
              selectedProvider.model === item.model;
            const providerColor =
              item.provider === 'openai' ? Colors.openai : Colors.anthropic;

            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(item)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${item.label} by ${item.provider}`}
              >
                {/* Provider dot */}
                <View style={[styles.dot, { backgroundColor: providerColor }]} />

                <View style={styles.rowContent}>
                  <Text
                    style={[styles.modelName, isSelected && styles.modelNameSelected]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.providerName}>
                    {item.provider === 'openai' ? 'OpenAI' : 'Anthropic'} ·{' '}
                    {(item.contextWindow / 1000).toFixed(0)}k context
                  </Text>
                </View>

                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  list: { padding: Spacing.md, gap: Spacing.xs },
  separator: { height: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  rowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  rowContent: { flex: 1 },
  modelName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  modelNameSelected: { color: Colors.primary },
  providerName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  checkmark: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
