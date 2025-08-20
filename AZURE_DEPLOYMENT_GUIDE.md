# Azure Deployment Guide for Inland Cafe POS

This guide will walk you through deploying your POS application to Azure App Service.

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **Azure CLI**: Install the Azure CLI on your machine
3. **Node.js**: Version 18 or higher
4. **Git**: For version control (optional but recommended)

## Method 1: Manual Deployment (Recommended for Beginners)

### Step 1: Install Azure CLI

**Windows:**
```bash
winget install Microsoft.AzureCLI
```

**macOS:**
```bash
brew install azure-cli
```

**Linux (Ubuntu/Debian):**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Step 2: Login to Azure

```bash
az login
```

This will open a browser window for authentication.

### Step 3: Set Your Subscription (if you have multiple)

```bash
# List your subscriptions
az account list --output table

# Set the active subscription
az account set --subscription "Your-Subscription-Name"
```

### Step 4: Create Azure Resources

Run the deployment script:

```bash
# Make the script executable
chmod +x azure-deploy.sh

# Run the deployment
./azure-deploy.sh
```

### Step 5: Configure Environment Variables

```bash
# Set JWT secret for production
az webapp config appsettings set \
    --resource-group inland-cafe-pos-rg \
    --name inland-cafe-pos \
    --settings JWT_SECRET="your-super-secure-jwt-secret-here"
```

### Step 6: Access Your Application

Your app will be available at: `https://inland-cafe-pos.azurewebsites.net`

## Method 2: GitHub Actions (Automated Deployment)

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/inland-cafe-pos.git
git push -u origin main
```

### Step 2: Create Azure Service Principal

```bash
az ad sp create-for-rbac --name "inland-cafe-pos-sp" --role contributor \
    --scopes /subscriptions/{subscription-id}/resourceGroups/inland-cafe-pos-rg \
    --sdk-auth
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add a new secret named `AZURE_CREDENTIALS`
4. Paste the JSON output from the service principal creation

### Step 4: Deploy

Push any change to the main branch, and GitHub Actions will automatically deploy your app.

## Method 3: Azure Container Registry (Advanced)

### Step 1: Build and Push Docker Image

```bash
# Login to Azure Container Registry
az acr login --name yourregistryname

# Build the image
docker build -t inland-cafe-pos .

# Tag the image
docker tag inland-cafe-pos yourregistryname.azurecr.io/inland-cafe-pos:latest

# Push to registry
docker push yourregistryname.azurecr.io/inland-cafe-pos:latest
```

### Step 2: Deploy from Container Registry

```bash
az webapp config container set \
    --resource-group inland-cafe-pos-rg \
    --name inland-cafe-pos \
    --docker-custom-image-name yourregistryname.azurecr.io/inland-cafe-pos:latest
```

## Configuration Options

### Environment Variables

Set these in Azure App Service Configuration:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secure-jwt-secret
```

### Scaling Options

**Free Tier (F1):**
- Good for testing and development
- Limited resources
- No custom domain

**Basic Tier (B1):**
- Suitable for small businesses
- Custom domain support
- SSL certificate included

**Standard Tier (S1):**
- Better performance
- Auto-scaling
- More resources

### Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
    --webapp-name inland-cafe-pos \
    --resource-group inland-cafe-pos-rg \
    --hostname yourdomain.com

# Configure SSL
az webapp config ssl bind \
    --certificate-thumbprint your-cert-thumbprint \
    --ssl-type SNI \
    --name inland-cafe-pos \
    --resource-group inland-cafe-pos-rg
```

## Monitoring and Logs

### View Application Logs

```bash
# Stream logs in real-time
az webapp log tail --name inland-cafe-pos --resource-group inland-cafe-pos-rg

# Download logs
az webapp log download --name inland-cafe-pos --resource-group inland-cafe-pos-rg
```

### Application Insights (Optional)

```bash
# Create Application Insights
az monitor app-insights component create \
    --app inland-cafe-pos-insights \
    --location eastus \
    --resource-group inland-cafe-pos-rg \
    --application-type web

# Get the instrumentation key
az monitor app-insights component show \
    --app inland-cafe-pos-insights \
    --resource-group inland-cafe-pos-rg \
    --query instrumentationKey --output tsv
```

## Database Considerations

### Current Setup (SQLite)
- The app currently uses SQLite
- Data is stored locally on the server
- Not suitable for production with multiple instances

### Recommended: Azure SQL Database

For production, consider migrating to Azure SQL Database:

1. Create Azure SQL Database
2. Update database connection in the app
3. Migrate existing data

### Alternative: Azure Cosmos DB

For better scalability:
1. Create Cosmos DB account
2. Update database queries
3. Migrate data structure

## Security Best Practices

1. **Use Environment Variables**: Never hardcode secrets
2. **Enable HTTPS**: Always use SSL/TLS
3. **Regular Updates**: Keep dependencies updated
4. **Backup Strategy**: Implement regular backups
5. **Access Control**: Use Azure AD for authentication

## Cost Optimization

### Free Tier Usage
- Use F1 tier for development/testing
- Limited to 1GB RAM and 1 CPU
- 60 minutes/day of compute time

### Production Recommendations
- Start with B1 tier ($13/month)
- Monitor usage and scale as needed
- Use reserved instances for cost savings

## Troubleshooting

### Common Issues

1. **App won't start**
   - Check logs: `az webapp log tail`
   - Verify environment variables
   - Check Node.js version compatibility

2. **Database connection issues**
   - Verify database file permissions
   - Check if database file exists
   - Review connection string

3. **Build failures**
   - Check Node.js version
   - Verify all dependencies are installed
   - Review build logs

### Useful Commands

```bash
# Restart the app
az webapp restart --name inland-cafe-pos --resource-group inland-cafe-pos-rg

# Check app status
az webapp show --name inland-cafe-pos --resource-group inland-cafe-pos-rg

# Update app settings
az webapp config appsettings set --name inland-cafe-pos --resource-group inland-cafe-pos-rg --settings KEY=VALUE

# Delete resources (cleanup)
az group delete --name inland-cafe-pos-rg --yes
```

## Support

- **Azure Documentation**: https://docs.microsoft.com/azure/
- **Azure CLI Reference**: https://docs.microsoft.com/cli/azure/
- **App Service Documentation**: https://docs.microsoft.com/azure/app-service/

## Next Steps

1. Set up monitoring and alerting
2. Implement automated backups
3. Configure CI/CD pipeline
4. Set up staging environment
5. Implement security scanning
6. Plan for scaling
