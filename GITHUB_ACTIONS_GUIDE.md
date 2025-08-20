# GitHub Actions + Azure Deployment Guide

This guide will walk you through setting up automated deployment from GitHub to Azure using GitHub Actions.

## Prerequisites

1. ✅ **GitHub Account** - You need a GitHub account
2. ✅ **Azure Account** - You need an Azure subscription
3. ✅ **Azure CLI** - Already installed via pipx
4. ✅ **Git Repository** - Your code is already in Git

## Step 1: Create GitHub Repository

### 1.1 Go to GitHub.com
- Sign in to your GitHub account
- Click the "+" icon in the top right corner
- Select "New repository"

### 1.2 Repository Settings
- **Repository name**: `inland-cafe-pos`
- **Description**: `Point of Sale system for Inland Cafe with Azure deployment`
- **Visibility**: Public (for free GitHub Actions)
- **Initialize**: ❌ Don't initialize with README (we already have one)
- **Add .gitignore**: ❌ Don't add (we already have one)
- **Choose a license**: Optional

### 1.3 Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/inland-cafe-pos.git

# Push your code to GitHub
git push -u origin main
```

## Step 3: Login to Azure and Create Service Principal

### 3.1 Login to Azure
```bash
az login
```
This will open a browser window for authentication.

### 3.2 Check Your Subscription
```bash
az account show
```

### 3.3 Create Resource Group (if not exists)
```bash
az group create --name inland-cafe-pos-rg --location eastus
```

### 3.4 Create Service Principal
This creates a special account that GitHub Actions will use to deploy to Azure:

```bash
az ad sp create-for-rbac \
    --name "inland-cafe-pos-sp" \
    --role contributor \
    --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/inland-cafe-pos-rg \
    --sdk-auth
```

**Important**: Save the JSON output! It will look like this:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## Step 4: Add GitHub Secrets

### 4.1 Go to Your GitHub Repository
- Navigate to your repository on GitHub
- Click on "Settings" tab
- Click on "Secrets and variables" in the left sidebar
- Click on "Actions"

### 4.2 Add Azure Credentials Secret
- Click "New repository secret"
- **Name**: `AZURE_CREDENTIALS`
- **Value**: Paste the entire JSON output from Step 3.4
- Click "Add secret"

## Step 5: Update GitHub Actions Workflow

The workflow file `azure-deploy.yml` is already created. Let's make sure it's in the right place:

```bash
# Create .github/workflows directory
mkdir -p .github/workflows

# Move the workflow file
mv azure-deploy.yml .github/workflows/
```

## Step 6: Commit and Push Changes

```bash
# Add the workflow file
git add .github/workflows/azure-deploy.yml

# Commit the changes
git commit -m "Add GitHub Actions workflow for Azure deployment"

# Push to GitHub
git push origin main
```

## Step 7: Monitor the Deployment

### 7.1 Check GitHub Actions
- Go to your GitHub repository
- Click on "Actions" tab
- You should see your workflow running

### 7.2 Check Azure Resources
```bash
# List your web apps
az webapp list --resource-group inland-cafe-pos-rg

# Get the URL of your app
az webapp show --name inland-cafe-pos --resource-group inland-cafe-pos-rg --query defaultHostName -o tsv
```

## Step 8: Configure Environment Variables

```bash
# Set JWT secret for production
az webapp config appsettings set \
    --resource-group inland-cafe-pos-rg \
    --name inland-cafe-pos \
    --settings JWT_SECRET="your-super-secure-jwt-secret-here"
```

## How It Works

### Workflow Triggers
- **Push to main branch**: Automatically deploys
- **Pull request to main**: Runs tests but doesn't deploy
- **Manual trigger**: You can manually run the workflow

### What Happens During Deployment
1. **Checkout**: Downloads your code
2. **Setup Node.js**: Installs Node.js 18
3. **Install Dependencies**: Runs `npm ci`
4. **Build Application**: Runs `npm run build`
5. **Login to Azure**: Uses the service principal
6. **Deploy to Azure**: Uploads and starts your app
7. **Logout**: Cleans up Azure session

## Troubleshooting

### Common Issues

#### 1. "Permission denied" error
- Check if the service principal has the right permissions
- Verify the `AZURE_CREDENTIALS` secret is correct

#### 2. "Build failed" error
- Check the build logs in GitHub Actions
- Verify all dependencies are in `package.json`
- Check for TypeScript compilation errors

#### 3. "App won't start" error
- Check Azure App Service logs
- Verify environment variables are set
- Check if the port is correctly configured

### Useful Commands

```bash
# View GitHub Actions logs
# Go to GitHub > Actions > Click on workflow run > Click on job

# View Azure app logs
az webapp log tail --name inland-cafe-pos --resource-group inland-cafe-pos-rg

# Restart the app
az webapp restart --name inland-cafe-pos --resource-group inland-cafe-pos-rg

# Check app status
az webapp show --name inland-cafe-pos --resource-group inland-cafe-pos-rg
```

## Benefits of This Setup

✅ **Automated Deployment**: Every push to main deploys automatically  
✅ **Version Control**: Track all changes in Git  
✅ **Rollback**: Easy to revert to previous versions  
✅ **Testing**: Can add tests before deployment  
✅ **Security**: Credentials are encrypted in GitHub secrets  
✅ **Monitoring**: Built-in logging and monitoring  

## Next Steps

1. **Add Tests**: Create unit tests and add them to the workflow
2. **Staging Environment**: Set up a staging environment for testing
3. **Custom Domain**: Configure a custom domain for your app
4. **Monitoring**: Set up Application Insights for better monitoring
5. **Backup Strategy**: Implement automated backups

## Cost Considerations

- **GitHub Actions**: Free for public repositories (2000 minutes/month)
- **Azure App Service**: 
  - F1 (Free): $0/month (limited)
  - B1 (Basic): ~$13/month (recommended)
  - S1 (Standard): ~$73/month (scaling)

## Security Best Practices

1. **Rotate Secrets**: Regularly update the service principal
2. **Limit Permissions**: Use least privilege principle
3. **Monitor Access**: Review who has access to your repository
4. **Environment Variables**: Never commit secrets to code
5. **HTTPS Only**: Always use HTTPS for production

Your app will be available at: `https://inland-cafe-pos.azurewebsites.net`
