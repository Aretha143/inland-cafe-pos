# Render Deployment Guide for Inland Cafe POS

## Overview
This guide will help you deploy the Inland Cafe POS system to Render with proper database configuration.

## Prerequisites
- A Render account
- Your GitHub repository connected to Render

## Deployment Steps

### 1. Connect Your Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository: `inland-cafe-pos`

### 2. Configure Build Settings
Use these settings in your Render dashboard:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
```
NODE_VERSION=18.20.0
NODE_ENV=production
```

### 3. Database Options

#### Option A: Use SQLite (Recommended for Free Tier)
The application will automatically use SQLite with fallback support:
- `better-sqlite3` (primary)
- `sqlite3` (fallback if better-sqlite3 fails)

No additional configuration needed.

#### Option B: Use Azure SQL Database
If you have an Azure SQL Database, set these environment variables:

```
USE_AZURE_SQL=true
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password
```

### 4. Deploy
1. Click "Create Web Service"
2. Wait for the build to complete
3. Your application will be available at the provided URL

## Troubleshooting

### Common Issues

#### 1. better-sqlite3 Compilation Error
**Error:** C++20 compilation errors with Node.js 24
**Solution:** The application now has automatic fallback to `sqlite3`

#### 2. Database Connection Issues
**Error:** Database not initialized
**Solution:** Check that the database file path is writable

#### 3. Port Issues
**Error:** Port already in use
**Solution:** Render automatically assigns ports, no configuration needed

### Logs
Check the logs in your Render dashboard for detailed error information.

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version to use | `18.20.0` |
| `NODE_ENV` | Environment mode | `production` |
| `USE_AZURE_SQL` | Use Azure SQL instead of SQLite | `false` |
| `AZURE_SQL_SERVER` | Azure SQL server URL | - |
| `AZURE_SQL_DATABASE` | Azure SQL database name | - |
| `AZURE_SQL_USER` | Azure SQL username | - |
| `AZURE_SQL_PASSWORD` | Azure SQL password | - |

## Support
If you encounter issues:
1. Check the Render logs
2. Verify environment variables
3. Ensure your repository is properly connected
4. Contact support if needed

## Notes
- The free tier has limitations on build time and runtime
- SQLite is recommended for the free tier
- Consider upgrading to a paid plan for production use
