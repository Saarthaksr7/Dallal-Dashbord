# Production Deployment Script for Dallal Dashboard (Windows)
# Run this in PowerShell as Administrator

Write-Host "🚀 Dallal Dashboard - Production Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "📋 Step 1: Checking Prerequisites..." -ForegroundColor Yellow

try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check Environment Files
Write-Host "📋 Step 2: Checking Environment Files..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found" -ForegroundColor Yellow
    Write-Host "Creating from template..."
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "❌ Please edit backend\.env and add your secrets" -ForegroundColor Red
    Write-Host "Run: python -c `"import secrets; print(secrets.token_urlsafe(32))`""
    exit 1
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env not found" -ForegroundColor Yellow
    Write-Host "Creating from template..."
    Copy-Item "frontend\.env.example" "frontend\.env"
}

Write-Host "✅ Environment files exist" -ForegroundColor Green
Write-Host ""

# Step 3: Validate Secrets
Write-Host "📋 Step 3: Validating Secrets..." -ForegroundColor Yellow

$envContent = Get-Content "backend\.env" -Raw
if ($envContent -match "CHANGE_ME") {
    Write-Host "❌ Found default secrets in backend\.env" -ForegroundColor Red
    Write-Host "Please update all CHANGE_ME values"
    exit 1
}

Write-Host "✅ Secrets validated" -ForegroundColor Green
Write-Host ""

# Step 4: Build Images
Write-Host "📋 Step 4: Building Docker Images..." -ForegroundColor Yellow

docker-compose -f docker-compose.prod.yml build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Images built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Start Services
Write-Host "📋 Step 5: Starting Services..." -ForegroundColor Yellow

docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services started" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Wait for Services
Write-Host "📋 Step 6: Waiting for Services to be Ready..." -ForegroundColor Yellow

Write-Host "Waiting for PostgreSQL..."
Start-Sleep -Seconds 5

Write-Host "Waiting for Redis..."
Start-Sleep -Seconds 2

Write-Host "Waiting for Backend..."
Start-Sleep -Seconds 5

Write-Host "✅ Services should be ready" -ForegroundColor Green
Write-Host ""

# Step 7: Health Checks
Write-Host "📋 Step 7: Running Health Checks..." -ForegroundColor Yellow

Write-Host "Checking services..."
docker-compose -f docker-compose.prod.yml ps

Write-Host ""

# Step 8: Display Status
Write-Host "📋 Step 8: Deployment Status" -ForegroundColor Yellow
Write-Host "=============================="
docker-compose -f docker-compose.prod.yml ps
Write-Host ""

# Step 9: Show Logs
Write-Host "📋 Step 9: Recent Logs" -ForegroundColor Yellow
Write-Host "======================"
docker-compose -f docker-compose.prod.yml logs --tail=20
Write-Host ""

# Step 10: Next Steps
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your domain DNS to point to this server"
Write-Host "2. Set up SSL certificates"
Write-Host "3. Configure your firewall (ports 80, 443)"
Write-Host "4. Set up monitoring and alerts"
Write-Host "5. Configure automated backups"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
Write-Host "  Stop:         docker-compose -f docker-compose.prod.yml down"
Write-Host "  Restart:      docker-compose -f docker-compose.prod.yml restart"
Write-Host "  Update:       docker-compose -f docker-compose.prod.yml build; docker-compose -f docker-compose.prod.yml up -d"
Write-Host ""
Write-Host "✅ Dallal Dashboard is now running in production mode!" -ForegroundColor Green
