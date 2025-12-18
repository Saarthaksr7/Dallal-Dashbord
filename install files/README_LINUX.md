# Linux Installation Scripts

This directory contains installation and deployment scripts for Linux systems.

## 📦 Available Scripts

### `install-linux-all.sh` (⭐ Recommended)
**All-in-one interactive installer**

Features:
- 🎯 Menu-driven interface
- 🐳 Optional Docker installation
- 🖥️ Optional Guacamole installation
- ⚙️ Systemd service setup
- 🔄 Auto-start at boot configuration
- 📊 Service management (start/stop/status)
- 📝 Comprehensive logging

Usage:
```bash
chmod +x install-linux-all.sh
./install-linux-all.sh
```

### `create-release-linux.sh`
**Creates a release package for distribution**

Creates a `.tar.gz` archive containing:
- Backend code
- Frontend (built)
- Installation scripts
- Documentation

Usage:
```bash
chmod +x create-release-linux.sh
./create-release-linux.sh
```

## 🚀 Quick Installation

### Option 1: Full Installation (Recommended)
```bash
cd "install files"
chmod +x install-linux-all.sh
./install-linux-all.sh
# Select option 1 from the menu
```

### Option 2: Dashboard Only
```bash
./install-linux-all.sh
# Select option 2 from the menu
```

## 📋 Installation Menu Options

| Option | Description |
|--------|-------------|
| 1 | **Full Installation** - Everything (Dashboard + Docker + Guacamole) |
| 2 | **Dashboard Only** - Just the core dashboard |
| 3 | **Dashboard + Docker** - Dashboard with container support |
| 4 | **Dashboard + Guacamole** - Dashboard with remote desktop |
| 5 | **Custom Installation** - Choose components |
| 6 | Start Services |
| 7 | Stop Services |
| 8 | Check Service Status |
| 9 | Enable Auto-Start at Boot |
| 10 | Disable Auto-Start at Boot |

## 🖥️ Supported Linux Distributions

- ✅ **Ubuntu** 18.04, 20.04, 22.04, 24.04
- ✅ **Debian** 10, 11, 12
- ✅ **Fedora** 35+
- ✅ **RHEL/CentOS** 8+
- ✅ **Arch Linux**

## 📦 What Gets Installed?

### Dashboard Components
- Python 3.8+ backend (FastAPI)
- React frontend (Vite)
- SQLite database (default)
- Virtual environment (.venv)
- Systemd service

### Optional Components
- **Docker Engine** - Container management
- **Docker Compose** - Multi-container orchestration
- **Apache Guacamole** - Remote desktop gateway (guacd)

### System Integration
- Systemd service files
- Auto-start at boot configuration
- Log management
- Service monitoring

## 🔧 Service Management

After installation, manage services with:

```bash
# Start all services
sudo systemctl start dallal-dashboard

# Stop all services
sudo systemctl stop dallal-dashboard

# Check status
sudo systemctl status dallal-dashboard

# View logs
sudo journalctl -u dallal-dashboard -f

# Enable auto-start
sudo systemctl enable dallal-dashboard

# Disable auto-start
sudo systemctl disable dallal-dashboard
```

## 📁 Installation Locations

```
Project Root/
├── .venv/                          # Python virtual environment
├── backend/
│   ├── .env                        # Configuration (auto-generated)
│   ├── dallal.db                   # SQLite database
│   └── logs/                       # Application logs
└── frontend/
    └── dist/                       # Built frontend files

System Files:
├── /etc/systemd/system/
│   └── dallal-dashboard.service   # Systemd service file
└── /opt/guacamole/                # Guacamole (if installed)
```

## 🌐 Access Points

After successful installation:

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | http://localhost:8000 | Main dashboard UI |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| ReDoc | http://localhost:8000/redoc | Alternative API documentation |

## 🐛 Troubleshooting

### Installation Issues

**Script permission denied:**
```bash
chmod +x install-linux-all.sh
./install-linux-all.sh
```

**Python version error:**
```bash
python3 --version  # Should be 3.8+

# Ubuntu/Debian - Install newer Python
sudo apt-get install python3.9 python3.9-venv
```

**Build tools missing:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3-dev

# Fedora/RHEL
sudo dnf install gcc python3-devel

# Arch
sudo pacman -S base-devel
```

### Runtime Issues

**Service won't start:**
```bash
# Check logs
sudo journalctl -u dallal-dashboard -n 50 --no-pager

# Check configuration
cat backend/.env

# Test manually
cd backend
source ../.venv/bin/activate
python3 main.py
```

**Port 8000 in use:**
```bash
# Find process using port
sudo lsof -i :8000

# Change port in .env
nano backend/.env
# Modify: GUNICORN_BIND=0.0.0.0:8080

# Restart service
sudo systemctl restart dallal-dashboard
```

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or run)
newgrp docker
```

## 📝 Log Files

Installation and runtime logs are stored in:

- **Installation log**: `install files/install-all.log`
- **Service logs**: `sudo journalctl -u dallal-dashboard`
- **Application logs**: `backend/logs/app.log`

View logs:
```bash
# Installation log
cat "install files/install-all.log"

# Service logs (live)
sudo journalctl -u dallal-dashboard -f

# Application logs
tail -f backend/logs/app.log
```

## 🔄 Updates

To update the dashboard:

```bash
# Pull latest changes
git pull

# Update dependencies
source .venv/bin/activate
pip install -r backend/requirements.txt --upgrade

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart service
sudo systemctl restart dallal-dashboard
```

## 🗑️ Uninstallation

To completely remove the installation:

```bash
# Stop and disable service
sudo systemctl stop dallal-dashboard
sudo systemctl disable dallal-dashboard

# Remove service file
sudo rm /etc/systemd/system/dallal-dashboard.service
sudo systemctl daemon-reload

# Remove project directory
rm -rf /path/to/Dallal-Dashboard

# Optional: Remove Docker
sudo apt-get remove docker-ce docker-ce-cli containerd.io

# Optional: Remove Guacamole
sudo systemctl stop guacd
sudo systemctl disable guacd
```

## 🔐 Security Notes

- The installer generates secure random secret keys
- Default configuration uses SQLite (suitable for development)
- For production, consider:
  - Using PostgreSQL instead of SQLite
  - Setting up SSL/TLS certificates
  - Enabling Redis for caching
  - Using a reverse proxy (nginx/apache)
  - Regular backups

## 📚 Additional Resources

- **Quick Start**: See `QUICKSTART_LINUX.md`
- **Main README**: See `../README.md`
- **Configuration Guide**: See `.env.example` in backend
- **API Documentation**: http://localhost:8000/docs (after installation)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `sudo journalctl -u dallal-dashboard`
2. Review the troubleshooting section above
3. Check existing GitHub issues
4. Create a new issue with:
   - Your Linux distribution and version
   - Installation log (`install-all.log`)
   - Service logs
   - Steps to reproduce

---

**Need help?** Open an issue on GitHub or check the documentation.
