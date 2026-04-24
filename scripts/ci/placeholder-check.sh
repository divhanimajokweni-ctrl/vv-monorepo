#!/bin/bash
# File: scripts/ci/placeholder-check.sh

echo "🔍 Checking for placeholder values..."

# Simple check for placeholders
if grep -r "0xplaceholder" packages/ tools/ scripts/ contracts/ --include="*.ts" --include="*.js" --include="*.json" >/dev/null 2>&1; then
    echo "❌ Found '0xplaceholder' patterns"
    echo "🚫 PLACEHOLDER VALUES DETECTED"
    echo "All placeholder values must be replaced with real cryptographic material."
    exit 1
fi

if grep -r "placeholder-signature" packages/ tools/ scripts/ contracts/ --include="*.ts" --include="*.js" --include="*.json" >/dev/null 2>&1; then
    echo "❌ Found 'placeholder-signature' patterns"
    echo "🚫 PLACEHOLDER VALUES DETECTED"
    echo "All placeholder values must be replaced with real cryptographic material."
    exit 1
fi

if grep -r "placeholder-key" packages/ tools/ scripts/ contracts/ --include="*.ts" --include="*.js" --include="*.json" >/dev/null 2>&1; then
    echo "❌ Found 'placeholder-key' patterns"
    echo "🚫 PLACEHOLDER VALUES DETECTED"
    echo "All placeholder values must be replaced with real cryptographic material."
    exit 1
fi

echo "✅ No placeholder values found. All cryptographic material is real."</content>
<parameter name="filePath">scripts/ci/placeholder-check.sh