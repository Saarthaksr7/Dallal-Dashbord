#!/bin/bash
# ============================================================================
# Dallal Dashboard - Linux Release Package Creator
# Creates a clean archive for GitHub release
# ============================================================================

set -e

cd "$(dirname "$0")"

PROJECT_DIR=".."
RELEASE_NAME="Dallal-Dashboard-Release-linux"
RELEASE_DIR="$PROJECT_DIR/$RELEASE_NAME"
ARCHIVE_FILE="$PROJECT_DIR/${RELEASE_NAME}.tar.gz"

clear
cat << "EOF"
============================================================================

          DALLAL DASHBOARD - RELEASE PACKAGE CREATOR (Linux)

============================================================================

This will create a clean archive for GitHub release.

The package will include:
  - Backend code
  - Frontend (pre-built)
  - Install scripts
  - Documentation

The package will EXCLUDE:
  - node_modules
  - .venv / virtualenv
  - .git
  - __pycache__
  - .env (sensitive data)

============================================================================

EOF

read -p "Press Enter to continue..."

# ============================================================================
# Clean up any previous release folder
# ============================================================================

echo ""
echo "[1/6] Cleaning up previous release folder..."

if [ -d "$RELEASE_DIR" ]; then
    rm -rf "$RELEASE_DIR"
fi
if [ -f "$ARCHIVE_FILE" ]; then
    rm -f "$ARCHIVE_FILE"
fi

mkdir -p "$RELEASE_DIR"

echo "✓ Clean slate ready"

# ============================================================================
# Copy Backend
# ============================================================================

echo ""
echo "[2/6] Copying backend..."

mkdir -p "$RELEASE_DIR/backend"
mkdir -p "$RELEASE_DIR/backend/app"

# Copy main backend files
cp "$PROJECT_DIR/backend/main.py" "$RELEASE_DIR/backend/" 2>/dev/null || true
cp "$PROJECT_DIR/backend/requirements.txt" "$RELEASE_DIR/backend/" 2>/dev/null || true
cp "$PROJECT_DIR/backend/.env.example" "$RELEASE_DIR/backend/" 2>/dev/null || true
cp "$PROJECT_DIR/backend/REQUIREMENTS.md" "$RELEASE_DIR/backend/" 2>/dev/null || true

# Copy app folder (recursive, exclude cache)
rsync -av --exclude='__pycache__' --exclude='*.pyc' \
    "$PROJECT_DIR/backend/app/" "$RELEASE_DIR/backend/app/" 2>/dev/null || \
    cp -r "$PROJECT_DIR/backend/app/"* "$RELEASE_DIR/backend/app/" 2>/dev/null || true

echo "✓ Backend copied"

# ============================================================================
# Copy Frontend (dist only for production)
# ============================================================================

echo ""
echo "[3/6] Copying frontend..."

mkdir -p "$RELEASE_DIR/frontend"

# Copy dist folder (pre-built frontend)
if [ -d "$PROJECT_DIR/frontend/dist" ]; then
    cp -r "$PROJECT_DIR/frontend/dist" "$RELEASE_DIR/frontend/"
    echo "✓ Pre-built frontend copied"
else
    echo "⚠ WARNING: Frontend dist folder not found!"
    echo "  Build the frontend first with: cd frontend && npm run build"
fi

# Also copy source for those who want to build themselves
mkdir -p "$RELEASE_DIR/frontend/src"
if [ -d "$PROJECT_DIR/frontend/src" ]; then
    rsync -av --exclude='node_modules' "$PROJECT_DIR/frontend/src/" "$RELEASE_DIR/frontend/src/" 2>/dev/null || \
        cp -r "$PROJECT_DIR/frontend/src/"* "$RELEASE_DIR/frontend/src/" 2>/dev/null || true
fi

cp "$PROJECT_DIR/frontend/package.json" "$RELEASE_DIR/frontend/" 2>/dev/null || true
cp "$PROJECT_DIR/frontend/package-lock.json" "$RELEASE_DIR/frontend/" 2>/dev/null || true
cp "$PROJECT_DIR/frontend/vite.config.js" "$RELEASE_DIR/frontend/" 2>/dev/null || true
cp "$PROJECT_DIR/frontend/index.html" "$RELEASE_DIR/frontend/" 2>/dev/null || true
cp "$PROJECT_DIR/frontend/.env.example" "$RELEASE_DIR/frontend/" 2>/dev/null || true
cp "$PROJECT_DIR/frontend/README.md" "$RELEASE_DIR/frontend/" 2>/dev/null || true

echo "✓ Frontend source copied"

# ============================================================================
# Copy Install Files
# ============================================================================

echo ""
echo "[4/6] Copying install files..."

mkdir -p "$RELEASE_DIR/install files"

# Copy Linux installation script
cp "install-linux-all.sh" "$RELEASE_DIR/install files/" 2>/dev/null || true

# Make scripts executable
chmod +x "$RELEASE_DIR/install files/"*.sh 2>/dev/null || true

# Copy any documentation
cp "CONFIG_GUIDE.md" "$RELEASE_DIR/install files/" 2>/dev/null || true
cp "INSTALLER_README.md" "$RELEASE_DIR/install files/" 2>/dev/null || true
cp "QUICKSTART.md" "$RELEASE_DIR/install files/" 2>/dev/null || true

echo "✓ Install files copied"

# ============================================================================
# Copy Root Documentation
# ============================================================================

echo ""
echo "[5/6] Copying documentation..."

cp "$PROJECT_DIR/README.md" "$RELEASE_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/LICENSE" "$RELEASE_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/.gitignore" "$RELEASE_DIR/" 2>/dev/null || true

echo "✓ Documentation copied"

# ============================================================================
# Create Installation Guide for Linux
# ============================================================================

cat > "$RELEASE_DIR/INSTALL_LINUX.md" << 'EOF'
# Dallal Dashboard - Linux Installation Guide

## Quick Start

1. **Extract the archive:**
   ```bash
   tar -xzf Dallal-Dashboard-Release-linux.tar.gz
   cd Dallal-Dashboard-Release-linux
   ```

2. **Run the installer:**
   ```bash
   cd "install files"
   chmod +x install-linux-all.sh
   ./install-linux-all.sh
   ```

3. **Choose installation type:**
   - Option 1: Full Installation (recommended) - Installs everything
   - Option 2: Dashboard Only - Just the dashboard
   - Option 3: Dashboard + Docker
   - Option 4: Dashboard + Guacamole

## Features

The installer will:
- ✓ Install all dependencies automatically
- ✓ Set up Docker (optional)
- ✓ Install Apache Guacamole (optional)
- ✓ Create systemd services
- ✓ Enable auto-start at boot (optional)

## System Requirements

- Linux distribution (Ubuntu/Debian/Fedora/RHEL/Arch)
- Python 3.8 or higher
- 2GB RAM minimum
- 10GB disk space

## Manual Installation

If you prefer manual installation:

1. **Install Python dependencies:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit as needed
   ```

3. **Run the dashboard:**
   ```bash
   python3 main.py
   ```

4. **Access the dashboard:**
   - URL: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Service Management

After installation with systemd:

```bash
# Start services
sudo systemctl start dallal-dashboard

# Stop services
sudo systemctl stop dallal-dashboard

# Check status
sudo systemctl status dallal-dashboard

# Enable auto-start
sudo systemctl enable dallal-dashboard

# View logs
sudo journalctl -u dallal-dashboard -f
```

## Troubleshooting

**Port already in use:**
```bash
# Check what's using port 8000
sudo lsof -i :8000
# Kill the process or change the port in .env
```

**Permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**Database errors:**
```bash
# Reset the database
rm backend/dallal.db
# Restart the service
sudo systemctl restart dallal-dashboard
```

## Support

For issues and questions:
- GitHub: https://github.com/Saarthaksr7/Dallal-Dashbord
- Documentation: See README.md

EOF

echo "✓ Installation guide created"

# ============================================================================
# Create Archive
# ============================================================================

echo ""
echo "[6/6] Creating archive..."

cd "$PROJECT_DIR"
tar -czf "$ARCHIVE_FILE" \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='.env' \
    "$RELEASE_NAME"

if [ $? -ne 0 ]; then
    echo "✗ ERROR: Could not create archive"
    echo "Please create manually: tar -czf $ARCHIVE_FILE $RELEASE_NAME"
    exit 1
fi

# Get archive size
ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)

echo "✓ Archive created"

# ============================================================================
# Cleanup and Summary
# ============================================================================

echo ""
cat << "EOF"
════════════════════════════════════════════════════════════════════════

                   RELEASE PACKAGE CREATED!

════════════════════════════════════════════════════════════════════════
EOF

echo ""
echo "Archive: $ARCHIVE_FILE"
echo "Size: $ARCHIVE_SIZE"
echo "Folder: $RELEASE_DIR"
echo ""
echo "Contents:"
echo "  /backend              - Python backend code"
echo "  /frontend             - React frontend (source + dist)"
echo "  /install files        - Linux installer script"
echo "  /README.md            - Project documentation"
echo "  /INSTALL_LINUX.md     - Linux installation guide"
echo "  /LICENSE              - License file"
echo ""
echo "Next steps:"
echo "  1. Upload ${RELEASE_NAME}.tar.gz to GitHub Releases"
echo "  2. Users download, extract, and run: ./install files/install-linux-all.sh"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Optional: Clean up release directory
read -p "Remove temporary release directory? (y/n): " CLEANUP
if [[ $CLEANUP =~ ^[Yy]$ ]]; then
    rm -rf "$RELEASE_DIR"
    echo "✓ Cleanup complete"
fi

echo ""
echo "Release package ready!"
echo ""

exit 0
