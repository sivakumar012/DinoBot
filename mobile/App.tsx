/**
 * App root — navigation setup + AI disclosure gate.
 *
 * Store-compliance:
 * - AI Use Disclosure shown on first launch (Generative AI Safety, 2026 Mandate)
 * - Navigation uses react-navigation (industry standard, no inline state hacks)
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AIDisclosure } from './src/components/AIDisclosure';
import { useSettingsStore } from './src/store/settings.store';
import { Colors } from './src/theme';

// ─── Navigation types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Chat: { conversationId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root component ───────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const { hasAcceptedAIDisclosure, acceptAIDisclosure } = useSettingsStore();

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
        translucent={false}
      />

      {/* AI Disclosure gate — must be accepted before using the app */}
      <AIDisclosure
        visible={!hasAcceptedAIDisclosure}
        onAccept={acceptAIDisclosure}
      />

      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
