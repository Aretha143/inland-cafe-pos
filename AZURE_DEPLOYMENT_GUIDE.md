# Azure Deployment Guide for Inland Cafe POS

## 🚨 **GitHub Actions Runtime Stack Issue - SOLVED**

If you're seeing the error: *"Configuring deployment with GitHub Actions is not currently supported for your selection of Runtime Stack"*, follow this guide to fix it.

## 🎯 **Solution: Use the Correct Runtime Stack**

### **Step 1: Create Azure App Service with Correct Runtime**

Run the updated deployment script:

```bash
chmod +x azure-deploy.sh
./azure-deploy.sh
```

This script uses `NODE:18-lts` runtime which **supports GitHub Actions**.

### **Step 2: Manual Azure Portal Setup (Alternative)**

If the script doesn't work, follow these steps:

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create App Service**:
   - Click "Create a resource"
   - Search for "Web App"
   - Click "Create"

3. **Configure App Service**:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `inland-cafe-pos`
   - **Publish**: Code
   - **Runtime stack**: **Node 18 LTS** (This supports GitHub Actions)
   - **Operating System**: Linux
   - **Region**: East US (or your preferred region)
   - **App Service Plan**: Create new
   - **SKU and size**: B1 (Basic) or F1 (Free)

4. **Click "Review + create"** then **"Create"**

## 🔧 **GitHub Actions Setup**

### **Step 1: Get Publish Profile**

1. Go to your Azure App Service
2. Click **"Deployment Center"**
3. Click **"GitHub Actions"**
4. Click **"Configure"**
5. Select your repository: `Aretha143/inland-cafe-pos`
6. Select branch: `main`
7. **Copy the publish profile** (you'll need this for secrets)

### **Step 2: Add GitHub Secrets**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Value**: Paste the publish profile from Azure

### **Step 3: Deploy**

1. The GitHub Actions workflow will automatically trigger on push to main
2. Or manually trigger from **Actions** tab in GitHub

## 📋 **Supported Runtime Stacks for GitHub Actions**

| Runtime Stack | GitHub Actions Support | Status |
|---------------|----------------------|---------|
| **Node 18 LTS** | ✅ **Supported** | **RECOMMENDED** |
| Node 16 LTS | ✅ Supported | Good |
| Node 14 LTS | ❌ Not supported | Avoid |
| Python 3.11 | ✅ Supported | Alternative |
| .NET 6 | ✅ Supported | Alternative |

## 🔍 **Troubleshooting**

### **Issue: "Runtime stack not supported"**
**Solution**: Use `NODE:18-lts` or `NODE:16-lts`

### **Issue: "GitHub Actions not available"**
**Solution**: 
1. Make sure you selected **Linux** as OS
2. Use **Node 18 LTS** runtime
3. Create a new App Service if needed

### **Issue: "Deployment fails"**
**Solution**:
1. Check GitHub Actions logs
2. Verify publish profile secret
3. Ensure repository permissions

## 🚀 **Alternative Deployment Methods**

### **Method 1: Azure CLI Deployment**
```bash
# Build locally
npm run build

# Deploy using Azure CLI
az webapp deployment source config-zip \
    --resource-group inland-cafe-pos-rg \
    --name inland-cafe-pos \
    --src dist.zip
```

### **Method 2: VS Code Azure Extension**
1. Install Azure App Service extension
2. Right-click on dist folder
3. Select "Deploy to Web App"

### **Method 3: Azure DevOps**
1. Create Azure DevOps project
2. Set up build pipeline
3. Configure release pipeline

## 📊 **Environment Variables**

Set these in Azure App Service Configuration:

```bash
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
```

## 🔐 **Security Best Practices**

1. **Use Azure Key Vault** for sensitive data
2. **Enable HTTPS** only
3. **Configure authentication** if needed
4. **Set up monitoring** and alerts

## 📈 **Monitoring**

- **Application Insights**: Enable for monitoring
- **Log Analytics**: Set up for log analysis
- **Azure Monitor**: Configure alerts

## 🎯 **Expected Results**

After successful deployment:
- ✅ App available at: `https://inland-cafe-pos.azurewebsites.net`
- ✅ GitHub Actions automatically deploy on push
- ✅ All POS functionality working
- ✅ Database operations functional

## 📞 **Support**

If you continue to have issues:
1. Check Azure App Service logs
2. Review GitHub Actions workflow logs
3. Verify runtime stack selection
4. Contact Azure support if needed

---

**Status**: ✅ Ready for deployment with correct runtime stack
**Last Updated**: August 21, 2025
