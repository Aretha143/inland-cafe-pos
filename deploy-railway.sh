#!/bin/bash

# Railway Deployment Automation Script
# This script prepares your project for Railway deployment

echo "🚀 Preparing Inland Cafe POS for Railway deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking current Git status..."

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run 'git init' first."
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes. Committing them..."
    git add .
    git commit -m "Auto-commit before Railway deployment"
    print_success "Changes committed successfully."
else
    print_success "No uncommitted changes found."
fi

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    print_warning "No remote origin found. You need to add your GitHub repository."
    echo ""
    echo "📋 To add your GitHub repository, run these commands:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/inland-cafe-pos.git"
    echo "   git push -u origin main"
    echo ""
    echo "🔗 First, create a repository on GitHub:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Repository name: inland-cafe-pos"
    echo "   3. Make it Public"
    echo "   4. Don't initialize with README"
    echo "   5. Click 'Create repository'"
    echo ""
else
    print_success "Remote origin found: $(git remote get-url origin)"
    
    # Check if we can push to remote
    print_status "Checking if we can push to remote..."
    if git ls-remote --exit-code origin &> /dev/null; then
        print_success "Remote repository is accessible."
        
        # Push to remote
        print_status "Pushing to GitHub..."
        if git push origin main; then
            print_success "Successfully pushed to GitHub!"
        else
            print_error "Failed to push to GitHub. Please check your credentials."
            exit 1
        fi
    else
        print_error "Cannot access remote repository. Please check your GitHub credentials."
        exit 1
    fi
fi

# Verify Railway configuration
print_status "Checking Railway configuration..."

if [ -f "railway.json" ]; then
    print_success "Railway configuration found."
else
    print_error "Railway configuration not found. Creating it..."
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
    print_success "Railway configuration created."
fi

# Verify package.json has correct scripts
print_status "Checking package.json configuration..."

if [ -f "package.json" ]; then
    if grep -q '"start"' package.json; then
        print_success "Start script found in package.json."
    else
        print_warning "Start script not found. Adding it..."
        # Add start script to package.json
        sed -i 's/"scripts": {/"scripts": {\n    "start": "node server\/index.js",/' package.json
        print_success "Start script added to package.json."
    fi
else
    print_error "package.json not found!"
    exit 1
fi

# Check if server/index.js exists
if [ -f "server/index.js" ]; then
    print_success "Production server file found."
else
    print_error "Production server file not found. Creating it..."
    
    # Create the production server file
    cat > server/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const ordersRoutes = require('./routes/orders');
const tablesRoutes = require('./routes/tables');
const customersRoutes = require('./routes/customers');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Inland Cafe POS API'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Inland Cafe POS Server running on port ${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
EOF
    print_success "Production server file created."
fi

# Test build
print_status "Testing build process..."

if npm run build; then
    print_success "Build test successful!"
else
    print_error "Build test failed. Please fix the build issues first."
    exit 1
fi

# Create deployment instructions
print_status "Creating deployment instructions..."

cat > RAILWAY_DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
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
EOF

print_success "Deployment instructions created: RAILWAY_DEPLOYMENT_INSTRUCTIONS.md"

echo ""
echo "🎉 ================================================="
echo "   RAILWAY DEPLOYMENT PREPARATION COMPLETE!"
echo "================================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Create GitHub repository (if not done)"
echo "   2. Push code to GitHub (if not done)"
echo "   3. Go to https://railway.app/"
echo "   4. Deploy from GitHub repository"
echo "   5. Configure environment variables"
echo ""
echo "📖 See RAILWAY_DEPLOYMENT_INSTRUCTIONS.md for details"
echo ""
echo "🔗 Your app will be live at: https://your-app-name.up.railway.app"
echo ""
