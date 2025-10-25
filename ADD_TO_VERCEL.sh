#!/bin/bash
# Add environment variables to Vercel from local .env
# Run: bash ADD_TO_VERCEL.sh
#
# This script reads from your local .env file and adds to Vercel
# Prevents exposing secrets in git

TOKEN="85CRjW6q2BObZRo7YIUYAOzg"

echo "🚀 Adding all environment variables to Vercel from .env file..."
echo ""
echo "⚠️  Make sure your .env file has all keys from jetlag-revweb!"
echo ""

# Load .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Copy keys from jetlag-revweb first."
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Add each key to Vercel
echo "Adding TRIPBASE_DATABASE_URL..."
echo "$TRIPBASE_DATABASE_URL" | vercel env add TRIPBASE_DATABASE_URL production preview development --token $TOKEN

echo "Adding AMADEUS_API_KEY..."
echo "$AMADEUS_API_KEY" | vercel env add AMADEUS_API_KEY production preview development --token $TOKEN

echo "Adding AMADEUS_API_SECRET..."
echo "$AMADEUS_API_SECRET" | vercel env add AMADEUS_API_SECRET production preview development --token $TOKEN

echo "Adding NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN..."
echo "$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN" | vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production preview development --token $TOKEN

echo "Adding STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production preview development --token $TOKEN

echo "Adding NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY..."
echo "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview development --token $TOKEN

echo "Adding KIWI_API_KEY..."
echo "$KIWI_API_KEY" | vercel env add KIWI_API_KEY production preview development --token $TOKEN

echo "Adding REDIS_URL..."
echo "$REDIS_URL" | vercel env add REDIS_URL production preview development --token $TOKEN

echo "Adding RESEND_API_KEY..."
echo "$RESEND_API_KEY" | vercel env add RESEND_API_KEY production preview development --token $TOKEN

echo ""
echo "✅ All keys added to Vercel!"
echo ""
echo "Now deploy:"
echo "vercel --prod --token $TOKEN"
