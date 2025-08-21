#!/bin/bash

echo "🔧 Azure SQL Database Configuration for Inland Cafe POS"
echo "======================================================"
echo ""

# Check if Azure SQL environment variables are set
if [ -z "$AZURE_SQL_SERVER" ] || [ -z "$AZURE_SQL_DATABASE" ] || [ -z "$AZURE_SQL_USER" ] || [ -z "$AZURE_SQL_PASSWORD" ]; then
    echo "❌ Azure SQL environment variables not found!"
    echo ""
    echo "Please set the following environment variables:"
    echo "export AZURE_SQL_SERVER=your-server.database.windows.net"
    echo "export AZURE_SQL_DATABASE=your-database-name"
    echo "export AZURE_SQL_USER=your-username"
    echo "export AZURE_SQL_PASSWORD=your-password"
    echo "export USE_AZURE_SQL=true"
    echo ""
    echo "Example:"
    echo "export AZURE_SQL_SERVER=inland-cafe-pos-server.database.windows.net"
    echo "export AZURE_SQL_DATABASE=inland-cafe-pos-db"
    echo "export AZURE_SQL_USER=admin"
    echo "export AZURE_SQL_PASSWORD=YourStrongPassword123!"
    echo "export USE_AZURE_SQL=true"
    echo ""
    echo "After setting these variables, run this script again."
    exit 1
fi

echo "✅ Azure SQL environment variables found!"
echo "Server: $AZURE_SQL_SERVER"
echo "Database: $AZURE_SQL_DATABASE"
echo "User: $AZURE_SQL_USER"
echo "Use Azure SQL: $USE_AZURE_SQL"
echo ""

# Stop the current development server if running
echo "🛑 Stopping current development server..."
pkill -f "npm run dev" || true
pkill -f "tsx server/index.ts" || true
pkill -f "vite" || true

sleep 2

echo "🚀 Starting server with Azure SQL configuration..."
echo ""

# Start the development server with Azure SQL environment
USE_AZURE_SQL=true npm run dev
