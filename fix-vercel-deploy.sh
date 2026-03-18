#!/bin/bash

# Fix Vercel Deployment Script
# This script sets the DATABASE_URL environment variable in Vercel
# and triggers a production redeploy to resolve 404 errors

set -e  # Exit on any error

echo "🔧 Fixing Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    curl -fsSL https://vercel.com/install.sh | sh
    export PATH="$HOME/.vercel/bin:$PATH"
fi

# Login to Vercel (if not already logged in)
echo "🔐 Ensuring Vercel login..."
vercel login --yes || echo "Already logged in"

# Link to project (if not linked)
echo "🔗 Linking to Vercel project..."
vercel link --yes || echo "Project already linked"

# Set DATABASE_URL for production environment
echo "🌍 Setting DATABASE_URL for production..."
echo "Enter your production DATABASE_URL (Supabase connection string):"
read -s DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

# Add environment variable
vercel env add DATABASE_URL production <<< "$DATABASE_URL"

# Redeploy to production
echo "🚀 Redeploying to production..."
vercel --prod

echo "✅ Deployment complete! Check your Vercel dashboard for the updated deployment."
echo "🌐 Your app should now be accessible without 404 errors."