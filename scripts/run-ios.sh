#!/bin/bash

# Get the absolute path to the project root (one level up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ROOT_DIR/template"

echo "📱 Launching iOS Simulator..."
open -a Simulator || echo "⚠️  Simulator app not found or could not be opened via 'open -a'"

echo "📂 Navigating to app directory: $APP_DIR"
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: App directory 'template' not found at $APP_DIR"
    exit 1
fi
cd "$APP_DIR"

echo "🚀 Running React Native (iOS)..."
# Prefer yarn if available
if command -v yarn &> /dev/null; then
    yarn ios
else
    npm run ios
fi
