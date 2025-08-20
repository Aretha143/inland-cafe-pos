#!/bin/bash

# Inland Cafe POS - Quick Deployment Script
# This script starts your POS system and exposes it publicly via ngrok

echo "🚀 Starting Inland Cafe POS System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Installing ngrok..."
    sudo apt update && sudo apt install -y ngrok
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application in the background
echo "🌐 Starting POS system..."
npm run dev &
POS_PID=$!

# Wait a moment for the server to start
sleep 5

# Check if the server is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ POS system is running on http://localhost:3001"
else
    echo "❌ Failed to start POS system"
    kill $POS_PID 2>/dev/null
    exit 1
fi

# Start ngrok to expose the server publicly
echo "🌍 Starting ngrok tunnel..."
ngrok http 3001 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PUBLIC_URL" ]; then
    echo ""
    echo "🎉 SUCCESS! Your POS system is now publicly accessible!"
    echo ""
    echo "📱 Local URL: http://localhost:3001"
    echo "🌐 Public URL: $PUBLIC_URL"
    echo ""
    echo "📋 Share this URL with your team:"
    echo "   $PUBLIC_URL"
    echo ""
    echo "🔐 Default Login Credentials:"
    echo "   Admin: admin / admin123"
    echo "   Cashier: cashier / cashier123"
    echo ""
    echo "⏹️  To stop the servers, press Ctrl+C"
    echo ""
else
    echo "❌ Failed to get public URL from ngrok"
    kill $POS_PID $NGROK_PID 2>/dev/null
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $POS_PID $NGROK_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
wait
