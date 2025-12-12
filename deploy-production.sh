#!/bin/bash
# Production Deployment Script for Dallal Dashboard
# This script automates the production deployment process

set -e  # Exit on error

echo "🚀 Dallal Dashboard - Production Deployment"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root${NC}"
   exit 1
fi

# Step 1: Check Prerequisites
echo "📋 Step 1: Checking Prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Check Environment Files
echo "📋 Step 2: Checking Environment Files..."

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found${NC}"
    echo "Creating from template..."
    cp backend/.env.example backend/.env
    echo -e "${RED}❌ Please edit backend/.env and add your secrets${NC}"
    echo "Run: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found${NC}"
    echo "Creating from template..."
    cp frontend/.env.example frontend/.env
    echo -e "${YELLOW}⚠️  Please edit frontend/.env if needed${NC}"
fi

echo -e "${GREEN}✅ Environment files exist${NC}"
echo ""

# Step 3: Validate Secrets
echo "📋 Step 3: Validating Secrets..."

if grep -q "CHANGE_ME" backend/.env; then
    echo -e "${RED}❌ Found default secrets in backend/.env${NC}"
    echo "Please update all CHANGE_ME values"
    exit 1
fi

echo -e "${GREEN}✅ Secrets validated${NC}"
echo ""

# Step 4: Build Images
echo "📋 Step 4: Building Docker Images..."

docker-compose -f docker-compose.prod.yml build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Images built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Start Services
echo "📋 Step 5: Starting Services..."

docker-compose -f docker-compose.prod.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Services started${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi
echo ""

# Step 6: Wait for Services
echo "📋 Step 6: Waiting for Services to be Ready..."

echo "Waiting for PostgreSQL..."
sleep 5

echo "Waiting for Redis..."
sleep 2

echo "Waiting for Backend..."
sleep 5

echo -e "${GREEN}✅ Services should be ready${NC}"
echo ""

# Step 7: Health Checks
echo "📋 Step 7: Running Health Checks..."

echo "Checking PostgreSQL..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U dallal
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL health check failed${NC}"
fi

echo "Checking Redis..."
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Redis health check failed${NC}"
fi

echo ""

# Step 8: Display Status
echo "📋 Step 8: Deployment Status"
echo "=============================="
docker-compose -f docker-compose.prod.yml ps
echo ""

# Step 9: Show Logs
echo "📋 Step 9: Recent Logs"
echo "======================"
docker-compose -f docker-compose.prod.yml logs --tail=20
echo ""

# Step 10: Next Steps
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Set up SSL certificates with certbot"
echo "3. Configure your firewall (ports 80, 443)"
echo "4. Set up monitoring and alerts"
echo "5. Configure automated backups"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop:         docker-compose -f docker-compose.prod.yml down"
echo "  Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "  Update:       git pull && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo -e "${GREEN}✅ Dallal Dashboard is now running in production mode!${NC}"
