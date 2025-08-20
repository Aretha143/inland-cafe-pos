#!/bin/bash

# GitHub Setup Script for Inland Cafe POS
# This script helps you connect your local repository to GitHub

echo "🚀 Setting up GitHub repository for Inland Cafe POS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run 'git init' first."
    exit 1
fi

# Check if remote origin exists
if git remote get-url origin &> /dev/null; then
    print_success "Remote origin already exists: $(git remote get-url origin)"
    
    # Test if we can push
    print_status "Testing connection to GitHub..."
    if git ls-remote --exit-code origin &> /dev/null; then
        print_success "GitHub repository is accessible!"
        
        # Push to GitHub
        print_status "Pushing to GitHub..."
        if git push -u origin main; then
            print_success "Successfully pushed to GitHub!"
            echo ""
            echo "🎉 Your code is now on GitHub!"
            echo "🔗 Repository URL: $(git remote get-url origin)"
            echo ""
            echo "📋 Next Steps:"
            echo "   1. Go to https://railway.app/"
            echo "   2. Click 'Start a New Project'"
            echo "   3. Select 'Deploy from GitHub repo'"
            echo "   4. Choose your inland-cafe-pos repository"
            echo "   5. Click 'Deploy'"
            echo ""
        else
            print_error "Failed to push to GitHub. Please check your credentials."
            exit 1
        fi
    else
        print_error "Cannot access GitHub repository. Please check your credentials."
        exit 1
    fi
else
    print_warning "No remote origin found. You need to create a GitHub repository first."
    echo ""
    echo "📋 Follow these steps:"
    echo ""
    echo "1️⃣  Create GitHub Repository:"
    echo "   - Go to: https://github.com/new"
    echo "   - Repository name: inland-cafe-pos"
    echo "   - Description: Point of Sale system for Inland Cafe"
    echo "   - Make it PUBLIC (required for free Railway)"
    echo "   - Don't initialize with README"
    echo "   - Click 'Create repository'"
    echo ""
    echo "2️⃣  After creating the repository, run this command:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/inland-cafe-pos.git"
    echo ""
    echo "3️⃣  Then run this script again to push your code:"
    echo "   ./setup-github.sh"
    echo ""
    echo "⚠️  Replace YOUR_USERNAME with your actual GitHub username"
    echo ""
fi
