/**
 * Design tokens — single source of truth for colours, spacing, typography.
 * Follows Material You (Android) and Human Interface Guidelines (iOS) neutral palette.
 */

export const Colors = {
  // Brand
  primary: '#5B6AF0',
  primaryDark: '#3D4ED4',
  primaryLight: '#EEF0FD',

  // Surfaces
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Bubbles
  bubbleUser: '#5B6AF0',
  bubbleUserText: '#FFFFFF',
  bubbleAssistant: '#FFFFFF',
  bubbleAssistantText: '#111827',

  // Status
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  success: '#10B981',
  offline: '#F59E0B',
  offlineLight: '#FFFBEB',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#5B6AF0',

  // Providers
  openai: '#10A37F',
  anthropic: '#D97706',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
