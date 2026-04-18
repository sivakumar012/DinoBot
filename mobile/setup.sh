#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# mobile/setup.sh — one-time React Native project scaffold
#
# Run this ONCE from the repo root:
#   bash mobile/setup.sh
#
# What it does:
#   1. Scaffolds the native Android + iOS projects via react-native init
#   2. Installs all JS dependencies
#   3. Installs iOS CocoaPods
#   4. Copies our source files into place
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_NAME="MultiLLMChat"
BUNDLE_ID="com.multillmchat.app"

echo "▶ Scaffolding React Native project: $APP_NAME"

# Scaffold into a temp dir then merge
npx react-native@0.76.5 init "$APP_NAME" \
  --package-name "$BUNDLE_ID" \
  --directory mobile_scaffold \
  --skip-install

echo "▶ Merging native projects into mobile/"
cp -r mobile_scaffold/android mobile/android
cp -r mobile_scaffold/ios     mobile/ios
cp    mobile_scaffold/index.js mobile/index.js 2>/dev/null || true
rm -rf mobile_scaffold

echo "▶ Installing JS dependencies"
cd mobile && npm install

echo "▶ Installing iOS pods"
cd ios && pod install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  Android:  cd mobile && npm run android"
echo "  iOS:      cd mobile && npm run ios"
echo "  Metro:    cd mobile && npm start"
