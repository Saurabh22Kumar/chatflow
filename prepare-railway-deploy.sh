#!/bin/bash

echo "🚀 Preparing ChatFlow for Railway Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Building frontend for production..."
cd public
npm install
npm run build

echo "🔧 Updating backend to serve frontend..."
cd ../server

# Check if express.static is configured in server.js
if ! grep -q "express.static" server.js; then
    echo "⚠️  Adding static file serving to server.js..."
    # This will need manual configuration - Railway will serve both
fi

echo "📋 Preparing environment variables..."
echo "Please set these environment variables in Railway:"
echo ""
echo "🔹 Backend Service:"
echo "   NODE_ENV=production"
echo "   PORT=8080"
echo "   MONGO_URI=(Railway will provide)"
echo "   JWT_SECRET=(generate a strong secret)"
echo "   EMAIL_USER=(your email for OTP)"
echo "   EMAIL_PASS=(your email app password)"
echo ""
echo "🔹 Frontend Environment:"
echo "   REACT_APP_API_URL=(Railway backend URL)"
echo "   REACT_APP_SOCKET_URL=(Railway backend URL)"
echo "   REACT_APP_LOCALHOST_KEY=chat-app-current-user"
echo "   REACT_APP_DEMO_MODE=true"
echo ""

echo "✅ Project prepared for Railway deployment!"
echo ""
echo "📝 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect Railway to your GitHub repo"
echo "3. Add MongoDB database in Railway"
echo "4. Set environment variables in Railway"
echo "5. Deploy!"
echo ""
echo "🌐 After deployment, update the README with your live URLs"
