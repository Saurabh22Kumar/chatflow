#!/bin/bash

# Deployment script for ChatFlow

echo "🚀 Starting ChatFlow deployment..."

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

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd public
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo "✅ All dependencies installed successfully"

# Check for environment files
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env file not found. Please copy .env.example to .env and configure it."
fi

if [ ! -f "public/.env" ]; then
    echo "⚠️  Warning: public/.env file not found. Please copy .env.example to .env and configure it."
fi

echo "🎉 Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env files in both server/ and public/ directories"
echo "2. Start the backend: cd server && npm start"
echo "3. Start the frontend: cd public && npm start"
echo "4. Open http://localhost:3000 in your browser"
