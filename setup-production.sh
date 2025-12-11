#!/bin/bash
# Quick Setup Script for Production Readiness Features
# Run this to install all dependencies and test the build

echo "🚀 Dallal Dashboard - Production Setup"
echo "======================================="
echo ""

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing Frontend Dependencies..."
cd frontend

# Install new production dependencies
npm install

echo ""
echo "✅ Frontend dependencies installed!"
echo ""

echo "🔨 Step 2: Testing Production Build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production build successful!"
    echo "📊 Check dist/stats.html for bundle analysis"
else
    echo ""
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo ""
echo "🐍 Step 3: Installing Backend Dependencies..."
cd ../backend

# Install production requirements
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backend dependencies installed!"
else
    echo ""
    echo "⚠️  Some backend dependencies may have failed. Check above for errors."
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review and update .env files:"
echo "   - backend/.env (copy from .env.example)"
echo "   - frontend/.env (copy from .env.example)"
echo ""
echo "2. Update these critical values in backend/.env:"
echo "   - SECRET_KEY (run: openssl rand -hex 32)"
echo "   - REFRESH_SECRET_KEY (run: openssl rand -hex 32)"
echo "   - DATABASE_URL (if using PostgreSQL)"
echo ""
echo "3. Test locally:"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Backend: cd backend && uvicorn main:app --reload"
echo ""
echo "4. Deploy to production:"
echo "   - docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📚 See deployment_guide.md for detailed instructions"
echo ""
