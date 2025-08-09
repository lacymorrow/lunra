#!/bin/bash

# 🔗 Webhook Secrets Setup Script
# This script adds the provided webhook secrets to your .env.local file

echo "🔗 Setting up webhook secrets for Lunra payment system..."

# Define the secrets
SNAP_SECRET="whsec_dECYZWpiAj5wXSXOxLkMxpV06qgQneDK"
THIN_SECRET="whsec_Qt7qb9KUafz7z3jG29YregGfi3LocZwv"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "📝 Creating .env.local file..."
    touch .env.local
fi

# Function to add or update environment variable
add_or_update_env() {
    local key=$1
    local value=$2
    local file=".env.local"

    if grep -q "^${key}=" "$file"; then
        # Update existing
        sed -i.bak "s/^${key}=.*/${key}=${value}/" "$file"
        echo "🔄 Updated ${key}"
    else
        # Add new
        echo "${key}=${value}" >>"$file"
        echo "✅ Added ${key}"
    fi
}

echo ""
echo "📝 Adding webhook secrets..."

# Add the webhook secrets
add_or_update_env "STRIPE_WEBHOOK_SECRET_SNAP" "$SNAP_SECRET"
add_or_update_env "STRIPE_WEBHOOK_SECRET_THIN" "$THIN_SECRET"

echo ""
echo "✅ Webhook secrets configured!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart your development server: pnpm dev"
echo "2. Test the configuration: curl 'http://localhost:3000/api/dev/test-payment-flow' | jq ."
echo "3. Configure webhook endpoints in Stripe Dashboard:"
echo "   - https://lunra.ai/api/webhooks/stripe/snapshot"
echo "   - https://lunra.ai/api/webhooks/stripe/thin"
echo ""
echo "📚 See docs/README.md for detailed instructions"
