# 🚀 Railway Deployment Instructions

## ✅ Your project is ready for Railway deployment!

### Step 1: Create GitHub Repository (if not done)
1. Go to https://github.com/new
2. Repository name: `inland-cafe-pos`
3. Make it **Public**
4. Don't initialize with README
5. Click "Create repository"

### Step 2: Push to GitHub (if not done)
```bash
git remote add origin https://github.com/YOUR_USERNAME/inland-cafe-pos.git
git push -u origin main
```

### Step 3: Deploy to Railway
1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access GitHub
5. Select your `inland-cafe-pos` repository
6. Click "Deploy"

### Step 4: Configure Environment Variables
After deployment starts:
1. Go to your project dashboard
2. Click "Variables" tab
3. Add these variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `JWT_SECRET` = `your-super-secure-jwt-secret-here`

### Step 5: Get Your Live URL
1. Go to "Settings" tab
2. Find your domain (e.g., `inland-cafe-pos-production.up.railway.app`)
3. Click the domain to open your live app!

## 🎉 Expected Result
- Live URL: `https://your-app-name.up.railway.app`
- HTTPS enabled
- Auto-deployment on every push
- Professional hosting

## 🔐 Login Credentials
- Admin: admin / admin123
- Cashier: cashier / cashier123

## 🆘 Troubleshooting
- Check Railway logs if deployment fails
- Verify environment variables are set
- Make sure repository is public
- Check if all dependencies are in package.json
