/**
 * OfflineBanner — shown whenever the device has no network connection.
 *
 * Store-compliance requirement (Guideline 2.5.2):
 * Every screen must have a "No Connection" state. Rejection is guaranteed
 * if the app shows a blank screen without internet.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface Props {
  visible: boolean;
}

export function OfflineBanner({ visible }: Props): React.JSX.Element | null {
  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>No internet connection — messages will send when you're back online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.offlineLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    ...Typography.bodySmall,
    color: Colors.warning,
    flex: 1,
  },
});
