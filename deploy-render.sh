#!/bin/bash

# Render Deployment Script for Inland Cafe POS
echo "🚀 Preparing for Render deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}[INFO]${NC} Your project is ready for Render deployment!"
echo ""
echo -e "${GREEN}📋 Follow these steps:${NC}"
echo ""
echo "1️⃣  Go to Render: https://render.com/"
echo "2️⃣  Sign up with GitHub"
echo "3️⃣  Click 'New +' → 'Web Service'"
echo "4️⃣  Connect your GitHub repository: inland-cafe-pos"
echo "5️⃣  Configure:"
echo "   - Name: inland-cafe-pos"
echo "   - Environment: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Plan: Free"
echo "6️⃣  Click 'Create Web Service'"
echo ""
echo -e "${YELLOW}⚙️  Environment Variables (set these in Render):${NC}"
echo "   NODE_ENV = production"
echo "   PORT = 10000"
echo "   JWT_SECRET = inland-cafe-pos-secret-2024"
echo ""
echo -e "${GREEN}🎯 Expected Result:${NC}"
echo "   Your app will be live at: https://inland-cafe-pos.onrender.com"
echo ""
echo -e "${GREEN}🔐 Login Credentials:${NC}"
echo "   Admin: admin / admin123"
echo "   Cashier: cashier / cashier123"
echo ""
echo -e "${BLUE}✅ Render is more reliable than Railway for Node.js apps!${NC}"
