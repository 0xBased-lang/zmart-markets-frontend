#!/bin/bash

# Script to add environment variables to Vercel
# Run this from zmart-frontend directory

echo "Adding environment variables to Vercel..."
echo ""

# Note: This requires manual confirmation for each variable
# Alternative: Add via Vercel Dashboard at https://vercel.com/kektech1/zmart-frontend/settings/environment-variables

echo "NEXT_PUBLIC_RPC_ENDPOINT"
echo "https://api.devnet.solana.com" | vercel env add NEXT_PUBLIC_RPC_ENDPOINT production

echo "NEXT_PUBLIC_CLUSTER"
echo "devnet" | vercel env add NEXT_PUBLIC_CLUSTER production

echo "NEXT_PUBLIC_PROPOSALS_PROGRAM_ID"
echo "Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7" | vercel env add NEXT_PUBLIC_PROPOSALS_PROGRAM_ID production

echo "NEXT_PUBLIC_CORE_PROGRAM_ID"
echo "3q38JSeuMykM6vjh8g8cbpUqkBhB4SvQkQ9XedesXApu" | vercel env add NEXT_PUBLIC_CORE_PROGRAM_ID production

echo "NEXT_PUBLIC_SUPABASE_URL"
echo "https://ybxnoassdrrhushqnsex.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo ""
echo "⚠️  For NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY:"
echo "Please add these manually via Vercel Dashboard for security:"
echo "https://vercel.com/kektech1/zmart-frontend/settings/environment-variables"
echo ""
echo "After adding all variables, run:"
echo "vercel --prod"
