# Dallal Dashboard - Linux Quick Start Guide

## 🚀 One-Command Installation

```bash
cd "install files"
chmod +x install-linux-all.sh
./install-linux-all.sh
```

## 📋 What Gets Installed?

The all-in-one installer provides:

### Installation Options
1. **Full Installation** (Recommended)
   - Dallal Dashboard (Backend + Frontend)
   - Docker Engine
   - Apache Guacamole
   - Systemd services
   - Auto-start at boot

2. **Dashboard Only**
   - Just the core dashboard
   - Perfect for minimal setups

3. **Dashboard + Docker**
   - Dashboard with container management

4. **Dashboard + Guacamole**
   - Dashboard with remote desktop gateway

5. **Custom Installation**
   - Pick and choose components

### Management Features
- 🟢 Start/Stop services
- 📊 Check service status
- 🔄 Enable/disable auto-start at boot
- 📝 Detailed logging

## 🖥️ Supported Distributions

- ✅ Ubuntu 18.04+
- ✅ Debian 10+
- ✅ Fedora 35+
- ✅ RHEL/CentOS 8+
- ✅ Arch Linux

## 📦 System Requirements

- **OS**: Linux (64-bit)
- **Python**: 3.8 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 10GB free space
- **Network**: Internet connection for initial setup

## 🎯 Quick Commands

### Using the Installer Menu

```bash
./install-linux-all.sh
# Then select from menu:
# 1 = Full installation
# 6 = Start services
# 9 = Enable auto-start at boot
```

### Manual Service Control

```bash
# Start dashboard
sudo systemctl start dallal-dashboard

# Stop dashboard
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

### Docker Commands (if installed)

```bash
# List running containers
docker ps

# View all containers
docker ps -a

# View Docker logs
docker logs <container-name>

# Start/stop containers
docker start <container-name>
docker stop <container-name>
```

### Guacamole Commands (if installed)

```bash
# Check Guacamole daemon status
sudo systemctl status guacd

# View Guacamole logs
sudo journalctl -u guacd -f

# Restart Guacamole
sudo systemctl restart guacd
```

## 🌐 Access Points

After installation:

- **Dashboard UI**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## 🔧 Configuration

### Environment File

The installer creates `.env` automatically with secure defaults.

To customize:
```bash
nano backend/.env
# Edit settings as needed
sudo systemctl restart dallal-dashboard
```

### Common Settings

```env
# Change server port
GUNICORN_BIND=0.0.0.0:8080

# Enable email notifications
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com

# Enable Redis caching
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0

# Database (switch from SQLite to PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/dallal_db
```

## 🐛 Troubleshooting

### Installation Issues

**Permission denied:**
```bash
chmod +x install-linux-all.sh
./install-linux-all.sh
```

**Python version too old:**
```bash
# Ubuntu/Debian
sudo apt-get install python3.9

# Update alternatives
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1
```

**Missing dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential python3-dev

# Fedora/RHEL
sudo dnf install -y gcc python3-devel
```

### Runtime Issues

**Port 8000 already in use:**
```bash
# Find what's using the port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Or change port in .env
nano backend/.env
# Set: GUNICORN_BIND=0.0.0.0:8080
```

**Database errors:**
```bash
# Reset SQLite database
rm backend/dallal.db

# Restart service
sudo systemctl restart dallal-dashboard
```

**Service won't start:**
```bash
# Check logs
sudo journalctl -u dallal-dashboard -n 50

# Check configuration
nano backend/.env

# Test manually
cd backend
source ../.venv/bin/activate
python3 main.py
```

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

## 📁 File Locations

```
/opt/dallal-dashboard/          # Installation directory (if system-wide)
~/.config/dallal-dashboard/     # User configuration
/var/log/dallal/                # Logs (if configured)
/etc/systemd/system/            # Service files
  ├── dallal-dashboard.service
  ├── guacd.service
  └── docker.service
```

## 🔄 Updates

To update Dallal Dashboard:

```bash
# Pull latest code
cd /path/to/Dallal-Dashboard
git pull

# Update Python dependencies
source .venv/bin/activate
pip install -r backend/requirements.txt --upgrade

# Rebuild frontend (if needed)
cd frontend
npm install
npm run build

# Restart services
sudo systemctl restart dallal-dashboard
```

## 🗑️ Uninstallation

To remove Dallal Dashboard:

```bash
# Stop and disable service
sudo systemctl stop dallal-dashboard
sudo systemctl disable dallal-dashboard

# Remove service file
sudo rm /etc/systemd/system/dallal-dashboard.service
sudo systemctl daemon-reload

# Remove installation directory
rm -rf /path/to/Dallal-Dashboard

# Optional: Remove Docker
sudo apt-get remove docker-ce docker-ce-cli containerd.io

# Optional: Remove Guacamole
sudo systemctl stop guacd
sudo systemctl disable guacd
sudo rm /etc/systemd/system/guacd.service
```

## 🆘 Getting Help

- **GitHub Issues**: https://github.com/Saarthaksr7/Dallal-Dashbord/issues
- **Documentation**: See README.md
- **Logs**: `sudo journalctl -u dallal-dashboard -f`

## 🎓 Advanced Usage

### Running Behind Nginx

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Using PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb dallal_db
sudo -u postgres createuser dallal_user

# Set password
sudo -u postgres psql
ALTER USER dallal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dallal_db TO dallal_user;
\q

# Update .env
DATABASE_URL=postgresql://dallal_user:your_password@localhost:5432/dallal_db
```

### Setting up SSL

```bash
# Get Let's Encrypt certificate
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d dashboard.yourdomain.com
```

## 📊 Monitoring

### View Resource Usage

```bash
# CPU and memory
htop

# Disk usage
df -h

# Service resource usage
systemctl status dallal-dashboard
```

### Log Management

```bash
# View last 100 lines
sudo journalctl -u dallal-dashboard -n 100

# Follow logs in real-time
sudo journalctl -u dallal-dashboard -f

# View logs from specific time
sudo journalctl -u dallal-dashboard --since "1 hour ago"

# Export logs
sudo journalctl -u dallal-dashboard > dallal-logs.txt
```

## 🚦 Health Checks

```bash
# Check if service is running
systemctl is-active dallal-dashboard

# Check if endpoint responds
curl http://localhost:8000/health

# Full API check
curl http://localhost:8000/api/v1/status
```

---

**Happy Dashboard Managing! 🎉**
