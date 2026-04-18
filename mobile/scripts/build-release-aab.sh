#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-release-aab.sh — builds a signed Android App Bundle for Play Store
#
# Prerequisites:
#   1. Run generate-keystore.sh first
#   2. Set signing vars in android/gradle.properties
#   3. Run setup.sh to scaffold the native project
#
# Usage:
#   bash mobile/scripts/build-release-aab.sh
#
# Output: mobile/android/app/build/outputs/bundle/release/app-release.aab
# ─────────────────────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")/.."

echo "▶ Cleaning previous build..."
cd android && ./gradlew clean

echo "▶ Building release AAB..."
./gradlew bundleRelease

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ -f "$AAB_PATH" ]; then
  echo ""
  echo "✅ AAB built successfully:"
  echo "   android/$AAB_PATH"
  echo ""
  echo "Upload this file to Google Play Console → Production → Create new release"
else
  echo "❌ Build failed — AAB not found at expected path"
  exit 1
fi
