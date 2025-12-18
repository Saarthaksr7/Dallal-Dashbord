#!/bin/bash
# ============================================================================
# Dallal Dashboard - Quick Start Script (Linux)
# Simple script to start the dashboard
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$PROJECT_ROOT/.venv"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
cat << "EOF"
════════════════════════════════════════════════════════════════════════

                   DALLAL DASHBOARD - QUICK START

════════════════════════════════════════════════════════════════════════
EOF

echo ""

# Check if systemd service exists and is installed
if systemctl list-unit-files | grep -q "dallal-dashboard.service"; then
    echo -e "${GREEN}Systemd service detected!${NC}"
    echo ""
    echo "Do you want to:"
    echo "  [1] Start via systemd service (recommended)"
    echo "  [2] Start manually in this terminal"
    echo ""
    read -p "Enter choice (1 or 2): " CHOICE
    
    if [ "$CHOICE" = "1" ]; then
        echo ""
        echo "Starting Dallal Dashboard service..."
        sudo systemctl start dallal-dashboard
        
        sleep 2
        
        if systemctl is-active --quiet dallal-dashboard; then
            echo -e "${GREEN}✓ Dashboard started successfully!${NC}"
            echo ""
            echo "Dashboard is running at: http://localhost:8000"
            echo "API Documentation: http://localhost:8000/docs"
            echo ""
            echo "To view logs: sudo journalctl -u dallal-dashboard -f"
            echo "To stop: sudo systemctl stop dallal-dashboard"
            echo ""
            
            # Open browser
            read -p "Open browser? (y/n): " OPEN_BROWSER
            if [[ $OPEN_BROWSER =~ ^[Yy]$ ]]; then
                if command -v xdg-open &> /dev/null; then
                    xdg-open http://localhost:8000 &
                elif command -v firefox &> /dev/null; then
                    firefox http://localhost:8000 &
                elif command -v google-chrome &> /dev/null; then
                    google-chrome http://localhost:8000 &
                fi
            fi
        else
            echo -e "${RED}✗ Failed to start service${NC}"
            echo "Check logs with: sudo journalctl -u dallal-dashboard -n 50"
        fi
        
        exit 0
    fi
fi

# Manual start
echo ""
echo "Starting dashboard manually..."
echo ""

# Check virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}✗ Virtual environment not found!${NC}"
    echo ""
    echo "Please run the installer first:"
    echo "  cd 'install files'"
    echo "  ./install-linux-all.sh"
    echo ""
    exit 1
fi

# Check backend directory
if [ ! -f "$BACKEND_DIR/main.py" ]; then
    echo -e "${RED}✗ Backend not found at: $BACKEND_DIR${NC}"
    exit 1
fi

# Check .env file
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠ No .env file found${NC}"
    echo ""
    read -p "Create default .env configuration? (y/n): " CREATE_ENV
    if [[ $CREATE_ENV =~ ^[Yy]$ ]]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            echo -e "${GREEN}✓ Created .env from example${NC}"
        else
            echo -e "${RED}✗ .env.example not found${NC}"
            echo "Please create .env manually or run the installer"
            exit 1
        fi
    else
        echo "Cannot start without .env file"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Verify dependencies
echo "Checking dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
    echo ""
    read -p "Install dependencies now? (y/n): " INSTALL_DEPS
    if [[ $INSTALL_DEPS =~ ^[Yy]$ ]]; then
        echo "Installing dependencies..."
        pip install -r "$BACKEND_DIR/requirements.txt"
    else
        echo "Cannot start without dependencies"
        exit 1
    fi
fi

# Change to backend directory
cd "$BACKEND_DIR"

# Start the server
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Starting Dallal Dashboard...${NC}"
echo ""
echo "  URL: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Wait a moment then try to open browser
(
    sleep 3
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000 &
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:8000 &
    elif command -v google-chrome &> /dev/null; then
        google-chrome http://localhost:8000 &
    fi
) &

# Start the server
python3 main.py

# If we get here, server stopped
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "Dashboard stopped"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
