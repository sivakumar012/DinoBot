/**
 * API base URL configuration.
 *
 * Priority order:
 *   1. REACT_APP_API_BASE_URL env var (CI/CD, production builds)
 *   2. Platform-specific dev defaults
 *
 * For production: set REACT_APP_API_BASE_URL to your deployed backend URL
 * e.g. https://multi-llm-orchestration-api.onrender.com/api
 */
import { Platform } from 'react-native';

function getApiBaseUrl(): string {
  // Injected at build time via react-native-config or babel env
  const envUrl = (globalThis as Record<string, unknown>)['REACT_APP_API_BASE_URL'] as
    | string
    | undefined;
  if (envUrl && envUrl.trim() !== '') return envUrl.trim();

  // Dev defaults
  if (__DEV__) {
    // Android emulator routes 10.0.2.2 → host machine localhost
    // iOS simulator can use localhost directly
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api'
      : 'http://localhost:3000/api';
  }

  // Fallback — replace with your production URL before submitting to stores
  return 'https://YOUR_DEPLOYED_BACKEND_URL/api';
}

export const API_BASE_URL = getApiBaseUrl();
