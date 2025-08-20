#!/bin/bash

# Vercel Deployment Script for Inland Cafe POS
echo "🚀 Preparing for Vercel deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[INFO]${NC} Your project is ready for Vercel deployment!"
echo ""
echo -e "${GREEN}📋 Follow these steps:${NC}"
echo ""
echo "1️⃣  Go to Vercel: https://vercel.com/"
echo "2️⃣  Sign up with GitHub"
echo "3️⃣  Click 'New Project'"
echo "4️⃣  Import your GitHub repository: inland-cafe-pos"
echo "5️⃣  Configure:"
echo "   - Framework Preset: Other"
echo "   - Root Directory: ./ (leave empty)"
echo "   - Build Command: npm run build"
echo "   - Output Directory: dist"
echo "   - Install Command: npm install"
echo "6️⃣  Click 'Deploy'"
echo ""
echo -e "${YELLOW}⚙️  Environment Variables (set these in Vercel):${NC}"
echo "   NODE_ENV = production"
echo "   JWT_SECRET = inland-cafe-pos-secret-2024"
echo ""
echo -e "${GREEN}🎯 Expected Result:${NC}"
echo "   Your app will be live at: https://inland-cafe-pos.vercel.app"
echo ""
echo -e "${GREEN}🔐 Login Credentials:${NC}"
echo "   Admin: admin / admin123"
echo "   Cashier: cashier / cashier123"
echo ""
echo -e "${BLUE}✅ Vercel Benefits:${NC}"
echo "   - Unlimited free tier"
echo "   - Global CDN"
echo "   - Auto-deployment"
echo "   - Custom domains"
echo "   - Excellent performance"
echo ""
echo -e "${YELLOW}⚠️  Note:${NC}"
echo "   Vercel works best with serverless functions."
echo "   Your API routes will be deployed as serverless functions."
