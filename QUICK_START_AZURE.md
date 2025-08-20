# Quick Start: Deploy to Azure in 5 Minutes

## Prerequisites Check

1. **Azure Account**: Do you have an Azure subscription? [Get one here](https://azure.microsoft.com/free/)
2. **Azure CLI**: Install it now:

```bash
# Windows
winget install Microsoft.AzureCLI

# macOS  
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

## Step-by-Step Deployment

### 1. Login to Azure
```bash
az login
```

### 2. Run the Deployment Script
```bash
./azure-deploy.sh
```

### 3. Set Production JWT Secret
```bash
az webapp config appsettings set \
    --resource-group inland-cafe-pos-rg \
    --name inland-cafe-pos \
    --settings JWT_SECRET="your-super-secure-secret-here"
```

### 4. Access Your App
Visit: `https://inland-cafe-pos.azurewebsites.net`

## Default Login Credentials
- **Admin**: admin / admin123
- **Cashier**: cashier / cashier123

## What You Get
- ✅ Full POS system deployed to Azure
- ✅ HTTPS enabled
- ✅ Auto-scaling capability
- ✅ 99.9% uptime SLA
- ✅ Global CDN
- ✅ SSL certificate included

## Cost
- **Free Tier (F1)**: $0/month (limited resources)
- **Basic Tier (B1)**: ~$13/month (recommended for production)

## Need Help?
- Check logs: `az webapp log tail --name inland-cafe-pos --resource-group inland-cafe-pos-rg`
- Restart app: `az webapp restart --name inland-cafe-pos --resource-group inland-cafe-pos-rg`
- Full guide: See `AZURE_DEPLOYMENT_GUIDE.md`

## Next Steps
1. Change default passwords
2. Set up custom domain
3. Configure backups
4. Set up monitoring
