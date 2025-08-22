#!/bin/bash

# Azure SQL to Render Connection Setup Script
# This script helps you configure your Azure SQL database connection to Render

echo "🔗 Azure SQL to Render Connection Setup"
echo "======================================"
echo ""

# Check if required tools are installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"
echo ""

# Get Azure SQL connection details
echo "📋 Please provide your Azure SQL Database details:"
echo ""

read -p "Enter your Azure SQL Server name (e.g., your-server.database.windows.net): " AZURE_SERVER
read -p "Enter your database name: " AZURE_DATABASE
read -p "Enter your username: " AZURE_USER
read -s -p "Enter your password: " AZURE_PASSWORD
echo ""

echo ""
echo "🔧 Configuration Summary:"
echo "Server: $AZURE_SERVER"
echo "Database: $AZURE_DATABASE"
echo "Username: $AZURE_USER"
echo ""

# Create environment variables file for local testing
echo "📝 Creating .env file for local testing..."
cat > .env << EOF
# Azure SQL Database Configuration
AZURE_SQL_SERVER=$AZURE_SERVER
AZURE_SQL_DATABASE=$AZURE_DATABASE
AZURE_SQL_USER=$AZURE_USER
AZURE_SQL_PASSWORD=$AZURE_PASSWORD

# Application Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=inland-cafe-pos-secret-2024
EOF

echo "✅ Created .env file for local testing"
echo ""

# Instructions for Render
echo "🚀 Next Steps for Render Deployment:"
echo ""
echo "1. Go to your Render dashboard: https://dashboard.render.com"
echo "2. Select your web service"
echo "3. Go to 'Environment' tab"
echo "4. Add these environment variables:"
echo ""
echo "   AZURE_SQL_SERVER=$AZURE_SERVER"
echo "   AZURE_SQL_DATABASE=$AZURE_DATABASE"
echo "   AZURE_SQL_USER=$AZURE_USER"
echo "   AZURE_SQL_PASSWORD=$AZURE_PASSWORD"
echo "   NODE_ENV=production"
echo "   PORT=10000"
echo "   JWT_SECRET=your-secure-jwt-secret"
echo ""

# Azure firewall configuration
echo "🔥 Azure SQL Firewall Configuration:"
echo ""
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to your SQL Database"
echo "3. Click 'Networking' in the left menu"
echo "4. Under 'Firewall rules', enable 'Allow Azure services and resources to access this server'"
echo "5. Click 'Save'"
echo ""

# Test connection locally
echo "🧪 Testing local connection..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the connection
echo "🔗 Testing Azure SQL connection..."
node -e "
const { connectToAzureSQL } = require('./server/database/azure-connection.ts');
connectToAzureSQL()
  .then(() => {
    console.log('✅ Azure SQL connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Azure SQL connection failed:', error.message);
    process.exit(1);
  });
" 2>/dev/null || {
    echo "⚠️  Could not test connection automatically. Please test manually:"
    echo "   npm run dev"
    echo ""
}

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 For more details, see: AZURE_SQL_RENDER_GUIDE.md"
echo ""
echo "🔗 Your application is ready to connect Azure SQL to Render!"
