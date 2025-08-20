# Student Account Deployment Guide

Since your Azure Student account has restrictions, here are alternative deployment options:

## Option 1: Use Azure Free Tier (Recommended)

### Step 1: Get Azure Free Tier
1. Go to [Azure Free Account](https://azure.microsoft.com/free/)
2. Sign up with a different email (not your student account)
3. You get $200 credit and 12 months of free services

### Step 2: Deploy Using Free Tier
Once you have a free tier account, follow the main deployment guide.

## Option 2: Local Development with Port Forwarding

### Step 1: Install ngrok
```bash
# Download ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Or download directly
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

### Step 2: Start Your Application
```bash
# Start your POS system
npm run dev
```

### Step 3: Expose Your Local Server
```bash
# In a new terminal
ngrok http 3001
```

This will give you a public URL like: `https://abc123.ngrok.io`

## Option 3: Use Railway (Free Alternative)

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Connect your repository

### Step 2: Deploy
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `inland-cafe-pos` repository
4. Railway will automatically detect and deploy your Node.js app

## Option 4: Use Render (Free Alternative)

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com/)
2. Sign up with GitHub
3. Connect your repository

### Step 2: Deploy
1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: inland-cafe-pos
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Option 5: Use Vercel (Free Alternative)

### Step 1: Create Vercel Account
1. Go to [Vercel.com](https://vercel.com/)
2. Sign up with GitHub
3. Import your repository

### Step 2: Configure
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=3000`

## Option 6: Use Netlify (Free Alternative)

### Step 1: Create Netlify Account
1. Go to [Netlify.com](https://netlify.com/)
2. Sign up with GitHub
3. Import your repository

### Step 2: Configure
1. Set build command: `npm run build`
2. Set publish directory: `dist`
3. Add environment variables

## Recommended Approach for Students

### For Learning/Testing:
- Use **ngrok** for temporary public access
- Use **Railway** or **Render** for free hosting

### For Production:
- Get Azure Free Tier account
- Follow the main deployment guide

## Quick Start with ngrok (Immediate Solution)

```bash
# 1. Install ngrok
sudo apt install ngrok

# 2. Start your app
npm run dev

# 3. In another terminal, expose your app
ngrok http 3001

# 4. Share the ngrok URL with others
# Example: https://abc123.ngrok.io
```

## Benefits of Each Option

| Platform | Free Tier | Ease of Use | Custom Domain | Database |
|----------|-----------|-------------|---------------|----------|
| Azure Free | ✅ $200 credit | ⭐⭐⭐ | ✅ | ✅ |
| Railway | ✅ 500 hours/month | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Render | ✅ 750 hours/month | ⭐⭐⭐⭐ | ✅ | ✅ |
| Vercel | ✅ Unlimited | ⭐⭐⭐⭐⭐ | ✅ | ❌ |
| Netlify | ✅ Unlimited | ⭐⭐⭐⭐ | ✅ | ❌ |
| ngrok | ✅ 40 connections | ⭐⭐⭐⭐⭐ | ❌ | ❌ |

## Next Steps

1. **Choose your preferred platform**
2. **Follow the specific guide for that platform**
3. **Deploy your POS system**
4. **Share the URL with your team**

## Troubleshooting Student Account Issues

If you encounter restrictions:
1. **Contact your institution** for Azure permissions
2. **Use alternative platforms** listed above
3. **Request Azure Free Tier** with different email
4. **Use local development** with ngrok for testing

Your POS system will work perfectly on any of these platforms!
