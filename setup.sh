#!/bin/bash

echo "🚀 Setting up Inland Cafe POS System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check your network connection."
    echo "💡 You can try running: npm install --verbose"
    exit 1
fi

echo "🗄️  Setting up database..."
npm run db:migrate

if [ $? -ne 0 ]; then
    echo "❌ Failed to run database migrations."
    exit 1
fi

echo "🌱 Seeding database with sample data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database."
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "🎉 Inland Cafe POS System is ready!"
echo ""
echo "📋 Default login credentials:"
echo "   Admin:   username: admin    password: admin123"
echo "   Cashier: username: cashier  password: cashier123"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📖 The application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
