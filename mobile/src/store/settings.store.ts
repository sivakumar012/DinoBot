/**
 * Settings store — persists user preferences across app restarts.
 * Manages: user identity, selected provider/model, onboarding state.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ProviderOption {
  provider: 'openai' | 'anthropic';
  model: string;
  label: string;
  contextWindow: number;
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    label: 'GPT-4o',
    contextWindow: 128000,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    contextWindow: 128000,
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    contextWindow: 16385,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    label: 'Claude 3.5 Haiku',
    contextWindow: 200000,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    label: 'Claude 3 Opus',
    contextWindow: 200000,
  },
];

interface SettingsState {
  // User identity (generated once, persisted)
  userId: string;

  // Selected provider + model
  selectedProvider: ProviderOption;

  // Onboarding — AI disclosure accepted (store-compliance: ToS requirement)
  hasAcceptedAIDisclosure: boolean;

  // Actions
  setSelectedProvider: (option: ProviderOption) => void;
  acceptAIDisclosure: () => void;
  setUserId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userId: '',
      selectedProvider: PROVIDER_OPTIONS[0]!,
      hasAcceptedAIDisclosure: false,

      setSelectedProvider: (option) => set({ selectedProvider: option }),
      acceptAIDisclosure: () => set({ hasAcceptedAIDisclosure: true }),
      setUserId: (id) => set({ userId: id }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
