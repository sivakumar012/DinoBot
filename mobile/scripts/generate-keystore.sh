#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-keystore.sh — generates the Android release signing keystore
#
# Run ONCE before your first Play Store submission:
#   bash mobile/scripts/generate-keystore.sh
#
# The keystore is written to mobile/android/app/release.keystore
# NEVER commit this file to git — it's in .gitignore
# Store it securely (1Password, AWS Secrets Manager, etc.)
# ─────────────────────────────────────────────────────────────────────────────
set -e

KEYSTORE_PATH="android/app/release.keystore"
KEY_ALIAS="multi-llm-chat"
VALIDITY_DAYS=10000   # ~27 years

if [ -f "$KEYSTORE_PATH" ]; then
  echo "⚠️  Keystore already exists at $KEYSTORE_PATH — skipping generation."
  exit 0
fi

echo "▶ Generating release keystore..."
echo "  You will be prompted for a keystore password and key password."
echo "  Use the SAME password for both (Play Store requirement)."
echo ""

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS"

echo ""
echo "✅ Keystore generated at $KEYSTORE_PATH"
echo ""
echo "Next: add these to mobile/android/gradle.properties (DO NOT commit):"
echo "  MYAPP_RELEASE_STORE_FILE=release.keystore"
echo "  MYAPP_RELEASE_KEY_ALIAS=$KEY_ALIAS"
echo "  MYAPP_RELEASE_STORE_PASSWORD=<your-password>"
echo "  MYAPP_RELEASE_KEY_PASSWORD=<your-password>"
