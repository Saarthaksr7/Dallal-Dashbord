# Homelab Deployment Guide - Dallal Dashboard

## 🏠 Homelab-Specific Setup

This guide is optimized for homelab/self-hosted environments with local network deployment.

---

## 📋 Prerequisites

### Hardware Requirements (Minimum)
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB
- **Network**: Gigabit ethernet recommended

### Software Requirements
- Docker & Docker Compose
- Operating System: Any (Linux/Windows/macOS)
- Optional: Reverse proxy (Traefik/Nginx Proxy Manager)

---

## 🌐 Network Configuration

### Option 1: Local Domain (Recommended)

**Using Pi-hole / AdGuard / Local DNS**:
```
dallal.local        → 192.168.1.100
dallal.homelab      → 192.168.1.100
dashboard.home      → 192.168.1.100
```

**Add to your DNS server**:
- A record: `dallal.local` → Your server IP
- A record: `api.dallal.local` → Your server IP

**Or use `/etc/hosts` (all devices)**:
```
192.168.1.100  dallal.local api.dallal.local
```

### Option 2: Direct IP Access
Access via `http://192.168.1.100:8080` (no domain needed)

### Option 3: Tailscale/Wireguard
Access securely from anywhere with VPN tunnel

---

## 🔐 SSL/TLS for Homelab

### Option 1: Self-Signed Certificate (Simplest)

```bash
# Generate self-signed certificate
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Homelab/CN=dallal.local"

# Add to trusted certificates on each device (optional)
# Windows: Import to Trusted Root Certification Authorities
# Linux: sudo cp certs/fullchain.pem /usr/local/share/ca-certificates/dallal.crt && sudo update-ca-certificates
# macOS: Import to Keychain and mark as trusted
```

### Option 2: Local CA (mkcert - Recommended)

```bash
# Install mkcert
# Windows: choco install mkcert
# macOS: brew install mkcert
# Linux: https://github.com/FiloSottile/mkcert

# Setup local CA
mkcert -install

# Generate certificates
cd certs
mkcert dallal.local "*.dallal.local" localhost 127.0.0.1 ::1 192.168.1.100

# Rename
mv dallal.local+5.pem fullchain.pem
mv dallal.local+5-key.pem privkey.pem
```

### Option 3: Let's Encrypt + Tunnel (Advanced)

If exposing via Cloudflare Tunnel or similar:
```bash
# Use certbot with DNS challenge
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d dallal.yourdomain.com
```

---

## 🐳 Homelab Docker Compose

Create `docker-compose.homelab.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: dallal-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: dallal_dashboard
      POSTGRES_USER: dallal
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme123}  # Change this!
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # Easy backup access
    networks:
      - dallal-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dallal"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: dallal-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-changeme456}  # Change this!
    volumes:
      - redis_data:/data
    networks:
      - dallal-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: dallal-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_URL=postgresql://dallal:${DB_PASSWORD:-changeme123}@postgres:5432/dallal_dashboard
      - REDIS_URL=redis://:${REDIS_PASSWORD:-changeme456}@redis:6379/0
      - BACKEND_CORS_ORIGINS=["http://dallal.local","https://dallal.local","http://192.168.1.100"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dallal-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "com.centurylinklabs.watchtower.enable=true"  # Auto-update with Watchtower

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: dallal-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - dallal-network
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: dallal-nginx
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP
      - "443:443"    # HTTPS
    volumes:
      - ./nginx.homelab.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
      - nginx_cache:/var/cache/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - dallal-network
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  nginx_cache:
    driver: local

networks:
  dallal-network:
    driver: bridge
```

---

## 🔧 Homelab Nginx Configuration

Create `nginx.homelab.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name dallal.local _;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name dallal.local;

        # SSL Certificate (self-signed or mkcert)
        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        # SSL Configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Health check
        location /health {
            proxy_pass http://backend:8000/health;
        }
    }
}
```

---

## 🚀 Deployment Steps

### 1. Prepare Environment

```bash
# Clone or navigate to project
cd "Dallal Dashbord"

# Create certificates directory
mkdir -p certs

# Generate SSL certificate (choose method above)
# Option 1: Self-signed
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/CN=dallal.local"

# Option 2: mkcert (recommended)
mkcert -install
cd certs && mkcert dallal.local localhost 127.0.0.1 192.168.1.100
mv dallal.local+3.pem fullchain.pem
mv dallal.local+3-key.pem privkey.pem
cd ..
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Edit backend/.env
nano backend/.env
```

**Homelab `.env` settings**:
```env
# Secrets (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-secret-key-here
REFRESH_SECRET_KEY=your-refresh-secret-here
API_KEY_SECRET=your-api-secret-here

# Database (matches docker-compose)
DATABASE_URL=postgresql://dallal:changeme123@postgres:5432/dallal_dashboard

# Redis (matches docker-compose)
REDIS_URL=redis://:changeme456@redis:6379/0

# CORS for homelab
BACKEND_CORS_ORIGINS=["http://dallal.local","https://dallal.local","http://192.168.1.100","http://localhost:8080"]

# Environment
ENVIRONMENT=production
DEBUG=false
ENABLE_DOCS=false  # Set to true if you want API docs in homelab

# Homelab-friendly settings
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 hours (longer for homelab)
```

### 3. Deploy

```bash
# Build and start
docker-compose -f docker-compose.homelab.yml up -d --build

# Check status
docker-compose -f docker-compose.homelab.yml ps

# View logs
docker-compose -f docker-compose.homelab.yml logs -f
```

### 4. Access Dashboard

- **HTTPS**: https://dallal.local (or your configured domain)
- **HTTP**: http://dallal.local (redirects to HTTPS)
- **Direct IP**: https://192.168.1.100

---

## 📱 Access from Other Devices

### Method 1: Local DNS
Add to your router's DNS or Pi-hole:
```
192.168.1.100  dallal.local
```

### Method 2: Hosts File (Each Device)

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac**: `/etc/hosts`
```
192.168.1.100  dallal.local api.dallal.local
```

### Method 3: Reverse Proxy (If Using Traefik/NPM)
Configure your existing reverse proxy to route to Dallal Dashboard

---

## 🔄 Backups (Homelab)

### Automated Backup Script

Create `backup-homelab.sh`:

```bash
#!/bin/bash
# Homelab backup script

BACKUP_DIR="/mnt/nas/backups/dallal"  # Change to your NAS path
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose -f docker-compose.homelab.yml exec -T postgres \
  pg_dump -U dallal dallal_dashboard | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup volumes
docker run --rm \
  -v dallal-dashboard_postgres_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/postgres_volume_$DATE.tar.gz -C /data .

# Keep last 7 days
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Schedule with Cron

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-homelab.sh
```

---

## 📊 Monitoring (Homelab)

### Option 1: Portainer (Recommended)
```bash
docker run -d -p 9000:9000 --name portainer --restart=unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```
Access: http://192.168.1.100:9000

### Option 2: Docker Stats
```bash
# Real-time monitoring
docker stats

# Container logs
docker-compose -f docker-compose.homelab.yml logs -f
```

### Option 3: Watchtower (Auto-updates)
```bash
docker run -d --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --cleanup --label-enable
```

---

## 🔧 Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.homelab.yml up -d --build

# Check logs
docker-compose -f docker-compose.homelab.yml logs -f
```

### Restore from Backup
```bash
# Stop containers
docker-compose -f docker-compose.homelab.yml down

# Restore database
gunzip < backup.sql.gz | docker-compose -f docker-compose.homelab.yml exec -T postgres \
  psql -U dallal dallal_dashboard

# Start containers
docker-compose -f docker-compose.homelab.yml up -d
```

---

## 🛡️ Security Best Practices (Homelab)

### Essential
- ✅ Change default passwords
- ✅ Use strong secrets
- ✅ Keep Docker updated
- ✅ Regular backups to NAS
- ✅ Firewall on host (block external access)

### Recommended
- ✅ Use mkcert for trusted certificates
- ✅ VPN for remote access (Tailscale/Wireguard)
- ✅ Segregate IoT network if using for IoT devices
- ✅ Regular updates with Watchtower
- ✅ Monitor logs periodically

### Optional
- Consider network segmentation (VLANs)
- Use fail2ban for brute force protection
- Set up intrusion detection
- Use hardware firewall rules

---

## 🎯 Homelab-Specific Features

### Access via VPN
```bash
# Tailscale (easiest)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Access from anywhere: https://dallal.local (via Tailscale)
```

### Integration with Home Assistant
Add to Home Assistant `configuration.yaml`:
```yaml
sensor:
  - platform: rest
    name: Dallal Dashboard Status
    resource: http://192.168.1.100/health
    value_template: '{{ value_json.status }}'
```

### Prometheus Metrics (Optional)
Enable metrics in backend `.env`:
```env
ENABLE_METRICS=true
```

Access metrics: http://192.168.1.100/metrics

---

## ✅ Homelab Deployment Checklist

- [ ] Docker & Docker Compose installed
- [ ] SSL certificates generated (self-signed or mkcert)
- [ ] Local DNS configured or hosts file updated
- [ ] Environment files created and secrets set
- [ ] Containers deployed and healthy
- [ ] Can access via https://dallal.local
- [ ] Backups configured to NAS
- [ ] Monitoring setup (Portainer recommended)
- [ ] Remote access via VPN (optional)
- [ ] Firewall blocks external access

---

## 📞 Homelab Support

**Common Issues**:
- Certificate warnings → Trust self-signed cert or use mkcert
- Can't access from phone → Check hosts file or DNS
- Slow performance → Check Docker resource limits
- Connection refused → Check firewall and port forwarding

---

## 🎉 You're Ready!

Your Dallal Dashboard is now running in your homelab with:
- ✅ Secure HTTPS (self-signed/mkcert)
- ✅ Local network access
- ✅ Docker orchestration
- ✅ Automated backups
- ✅ Easy monitoring
- ✅ VPN-ready for remote access

**Access**: https://dallal.local

Enjoy your homelab dashboard! 🏠
