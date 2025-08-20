# Vercel Deployment Troubleshooting Guide

## Current Issue: Serverless Function Crash (500 Error)

Your Vercel deployment is experiencing a serverless function crash. Here's how to fix it:

### 🔧 Quick Fix Steps

1. **Update Vercel Configuration**
   - The `vercel.json` has been updated to properly handle TypeScript and static builds
   - Server now uses in-memory database for serverless environments

2. **Redeploy with Updated Configuration**
   ```bash
   # Option 1: Using Vercel CLI
   vercel --prod
   
   # Option 2: Using the deployment script
   ./deploy-vercel.sh
   ```

3. **Check Build Logs**
   - Go to your Vercel dashboard
   - Click on the latest deployment
   - Check the "Build Logs" section for any errors

### 🐛 Common Issues and Solutions

#### Issue 1: Module Import Errors
**Error**: `Cannot find module` or `Unexpected token 'export'`

**Solution**: 
- Ensure all imports use `.js` extension in TypeScript files
- Check that `package.json` has `"type": "module"`

#### Issue 2: Database Connection Errors
**Error**: `SQLite database locked` or `ENOENT: no such file or directory`

**Solution**:
- Database now uses in-memory storage in production
- No file system dependencies in serverless environment

#### Issue 3: Build Failures
**Error**: Build process fails during deployment

**Solution**:
- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Ensure TypeScript compilation succeeds locally first

#### Issue 4: Static File Serving
**Error**: React app not loading or 404 errors

**Solution**:
- Static files are now served from `/dist` directory
- API routes are properly configured to bypass static serving

### 🔍 Debugging Steps

1. **Local Testing**
   ```bash
   # Test the build process locally
   npm run build
   
   # Test the server locally
   npm start
   ```

2. **Check Environment Variables**
   - Ensure `NODE_ENV=production` is set in Vercel
   - Add any required environment variables in Vercel dashboard

3. **Review Function Logs**
   - In Vercel dashboard, go to Functions tab
   - Check for any runtime errors

### 📋 Deployment Checklist

- [ ] `vercel.json` is properly configured
- [ ] `package.json` has correct build script
- [ ] All dependencies are in `dependencies` section
- [ ] TypeScript compilation works locally
- [ ] Environment variables are set in Vercel
- [ ] Database connection uses in-memory storage

### 🚀 Alternative Solutions

If the serverless approach continues to have issues, consider:

1. **Railway Deployment** (Recommended for full-stack apps)
   - Better support for persistent databases
   - More suitable for POS systems

2. **Render Deployment**
   - Good for Node.js applications
   - Supports persistent storage

3. **Azure Deployment**
   - Enterprise-grade hosting
   - Full control over infrastructure

### 📞 Getting Help

If you continue to experience issues:

1. Check the Vercel documentation: https://vercel.com/docs
2. Review the deployment logs in your Vercel dashboard
3. Test the application locally to isolate issues
4. Consider switching to a different hosting platform

### 🔐 Default Login Credentials

For testing the deployed application:
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

### 📊 Expected Behavior After Fix

- ✅ Application loads without 500 errors
- ✅ API endpoints respond correctly
- ✅ React frontend serves properly
- ✅ Database operations work (in-memory)
- ✅ All POS functionality available
