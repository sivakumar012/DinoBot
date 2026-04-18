# Multi-LLM Chat — React Native App

Cross-platform mobile app (iOS + Android) for the Multi-LLM Orchestration backend.

## Store Compliance

| Requirement | Implementation |
|---|---|
| AI Use Disclosure (2026 Mandate) | `AIDisclosure` modal shown on first launch, must be accepted |
| Report/Flag mechanism | 🚩 button on every assistant message → `ReportFlagModal` |
| Offline resilience | `OfflineBanner` on every screen, send disabled when offline |
| No dynamic code | No eval(), no remote JS loading |
| Privacy-first | No Camera/Location/Contacts permissions requested |
| State management | Zustand (industry standard, no inline state hacks) |
| Navigation | React Navigation native stack |
| Asset integrity | Fallback UI for empty/error states on every screen |

## Prerequisites

- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17

## Setup

```bash
cd mobile
npm install

# iOS
cd ios && pod install && cd ..

# Android — no extra steps needed
```

## Running

```bash
# Start Metro bundler
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

## Backend connection

The app connects to the backend at `http://10.0.2.2:3000/api` by default (Android emulator).

For iOS simulator, change `API_BASE_URL` in `src/api/client.ts` to `http://localhost:3000/api`.

For production, set `API_BASE_URL` to your deployed backend URL.

## Project structure

```
mobile/
├── App.tsx                        # Root: navigation + AI disclosure gate
├── src/
│   ├── api/client.ts              # Typed API client (all fetch calls here)
│   ├── store/
│   │   ├── chat.store.ts          # Zustand: conversations + messages
│   │   └── settings.store.ts     # Zustand: provider/model, user ID, onboarding
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Conversation list + new chat FAB
│   │   ├── ChatScreen.tsx         # Active chat with optimistic UI
│   │   └── SettingsScreen.tsx     # Model picker + privacy links
│   ├── components/
│   │   ├── MessageBubble.tsx      # Chat bubble with flag button + usage badge
│   │   ├── MessageInput.tsx       # Multi-line input bar
│   │   ├── ProviderPicker.tsx     # Bottom sheet model selector
│   │   ├── UsageBadge.tsx         # Token/cost/latency chips
│   │   ├── ErrorBanner.tsx        # Inline dismissible error
│   │   ├── OfflineBanner.tsx      # No-connection state (store-compliance)
│   │   ├── AIDisclosure.tsx       # Onboarding disclosure (store-compliance)
│   │   └── ReportFlagModal.tsx    # Flag AI content (store-compliance)
│   ├── hooks/
│   │   ├── useNetInfo.ts          # Network connectivity
│   │   └── useStreamingDots.ts    # Typing indicator animation
│   └── theme/index.ts             # Colors, spacing, typography tokens
```

## Adding a new provider

1. Add the provider/model to `PROVIDER_OPTIONS` in `src/store/settings.store.ts`
2. Register it in the backend (`src/index.ts`)
3. No other changes needed — the API client and UI are provider-agnostic
