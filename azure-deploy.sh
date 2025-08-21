#!/bin/bash

# Azure Deployment Script for Inland Cafe POS
# This script builds and deploys the application to Azure App Service

echo "🚀 Starting Azure deployment for Inland Cafe POS..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure first:"
    echo "   az login"
    exit 1
fi

# Configuration
RESOURCE_GROUP="inland-cafe-pos-rg"
APP_NAME="inland-cafe-pos"
LOCATION="eastus"
PLAN_NAME="inland-cafe-pos-plan"
SKU="B1"  # Basic tier - change to F1 for free tier

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Name: $APP_NAME"
echo "   Location: $LOCATION"
echo "   Plan: $PLAN_NAME"
echo "   SKU: $SKU"

# Create resource group
echo "🔧 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create app service plan
echo "📦 Creating app service plan..."
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku $SKU \
    --is-linux

# Create web app with GitHub Actions compatible runtime
echo "🌐 Creating web app..."
az webapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --runtime "NODE:18-lts"

# Configure environment variables
echo "⚙️ Configuring environment variables..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITE_NODE_DEFAULT_VERSION=18.17.0

# Configure startup command
echo "🔧 Configuring startup command..."
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --startup-file "npm start"

# Enable GitHub Actions deployment
echo "🔗 Enabling GitHub Actions deployment..."
az webapp deployment source config \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --repo-url "https://github.com/Aretha143/inland-cafe-pos.git" \
    --branch "main" \
    --manual-integration

echo "✅ Azure App Service configured successfully!"
echo ""
echo "🌐 Your app will be available at: https://$APP_NAME.azurewebsites.net"
echo ""
echo "📋 Next steps:"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to your App Service: $APP_NAME"
echo "3. Go to 'Deployment Center'"
echo "4. Select 'GitHub Actions' as deployment source"
echo "5. Connect your GitHub repository: Aretha143/inland-cafe-pos"
echo "6. Select branch: main"
echo "7. Deploy!"
echo ""
echo "📊 To monitor your app:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
