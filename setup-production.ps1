# Quick Setup Script for Production Readiness Features (Windows)
# Run this in PowerShell to install all dependencies and test the build

Write-Host "🚀 Dallal Dashboard - Production Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend

# Install new production dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Frontend dependencies installed!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to install frontend dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Step 2: Testing Production Build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Production build successful!" -ForegroundColor Green
    Write-Host "📊 Check dist/stats.html for bundle analysis" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🐍 Step 3: Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location ../backend

# Install production requirements
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend dependencies installed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some backend dependencies may have failed. Check above for errors." -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review and update .env files:"
Write-Host "   - backend\.env (copy from .env.example)"
Write-Host "   - frontend\.env (copy from .env.example)"
Write-Host ""
Write-Host "2. Update these critical values in backend\.env:"
Write-Host "   - SECRET_KEY (generate with: python -c 'import secrets; print(secrets.token_hex(32))')"
Write-Host "   - REFRESH_SECRET_KEY (generate another one)"
Write-Host "   - DATABASE_URL (if using PostgreSQL)"
Write-Host ""
Write-Host "3. Test locally:"
Write-Host "   - Frontend: cd frontend; npm run dev"
Write-Host "   - Backend: cd backend; uvicorn main:app --reload"
Write-Host ""
Write-Host "4. Deploy to production:"
Write-Host "   - docker-compose -f docker-compose.prod.yml up -d"
Write-Host ""
Write-Host "📚 See deployment_guide.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
