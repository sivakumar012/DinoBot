/**
 * UsageBadge — compact token/cost summary shown below assistant messages.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UsageSummary } from '../api/client';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface Props {
  usage: UsageSummary;
}

export function UsageBadge({ usage }: Props): React.JSX.Element {
  const costStr =
    usage.estimated_cost < 0.001
      ? '<$0.001'
      : `$${usage.estimated_cost.toFixed(4)}`;

  const latencyStr =
    usage.latency_ms >= 1000
      ? `${(usage.latency_ms / 1000).toFixed(1)}s`
      : `${usage.latency_ms}ms`;

  return (
    <View style={styles.container}>
      <Chip label={`↑${usage.tokens_in} ↓${usage.tokens_out} tokens`} />
      <Chip label={costStr} />
      <Chip label={latencyStr} />
    </View>
  );
}

function Chip({ label }: { label: string }): React.JSX.Element {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.primary,
  },
});
