# Dallal Dashboard - Homelab Quick Start

## 🏠 Homelab Deployment in 5 Minutes

### 1. Generate SSL Certificate (Choose One)

**Option A: mkcert (Recommended - Trusted by Browser)**
```bash
# Install mkcert
# Windows: choco install mkcert
# Mac: brew install mkcert
# Linux: wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 && chmod +x mkcert-v1.4.4-linux-amd64

# Install local CA
mkcert -install

# Generate certificate
mkdir certs
cd certs
mkcert dallal.local localhost 127.0.0.1 192.168.1.100
mv dallal.local+3.pem fullchain.pem
mv dallal.local+3-key.pem privkey.pem
cd ..
```

**Option B: Self-Signed (Simple)**
```bash
mkdir certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/CN=dallal.local"
```

### 2. Create Environment File

```bash
# Backend
cp backend/.env.example backend/.env

# Generate secrets
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> backend/.env
python -c "import secrets; print('REFRESH_SECRET_KEY=' + secrets.token_urlsafe(32))" >> backend/.env
python -c "import secrets; print('API_KEY_SECRET=' + secrets.token_urlsafe(32))" >> backend/.env

# Set passwords (edit these!)
export DB_PASSWORD=your  _db_password
export REDIS_PASSWORD=your_redis_password
```

### 3. Update /etc/hosts or DNS

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac**: `/etc/hosts`

Add this line:
```
192.168.1.100   dallal.local
```
(Replace with your actual server IP)

### 4. Deploy

```bash
docker-compose -f docker-compose.homelab.yml up -d

# Check status
docker-compose -f docker-compose.homelab.yml ps

# View logs
docker-compose -f docker-compose.homelab.yml logs -f
```

### 5. Access Dashboard

**URL**: https://dallal.local

If using self-signed cert, accept the security warning in your browser.

---

## 🔧 Quick Configuration

### Enable API Docs (Homelab Only)

Edit `backend/.env`:
```env
ENABLE_DOCS=true
```

Access docs at: https://dallal.local/docs

### Set Database Passwords

Create `.env` in project root:
```env
DB_PASSWORD=your_secure_db_password
REDIS_PASSWORD=your_secure_redis_password
```

### Configure CORS

Edit `backend/.env`:
```env
BACKEND_CORS_ORIGINS=["https://dallal.local","http://192.168.1.100"]
```

---

## 📱 Access from Other Devices

### Add to all devices' hosts file:
```
192.168.1.100   dallal.local
```

**Or configure in your router's DNS / Pi-hole**

---

## 🔄 Backup to NAS

Create `backup.sh`:
```bash
#!/bin/bash
docker-compose -f docker-compose.homelab.yml exec -T postgres \
  pg_dump -U dallal dallal_dashboard | gzip > /mnt/nas/dallal_backup_$(date +%Y%m%d).sql.gz
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 🎯 Common Homelab Scenarios

### Using with Portainer
Access: http://192.168.1.100:9000

### Using with Traefik
Remove nginx service, add Traefik labels

### Using with Home Assistant
Add REST sensor to monitor status

### Remote Access via Tailscale
```bash
sudo tailscale up
# Access from anywhere: https://dallal.local
```

---

## ✅ Homelab Checklist

- [ ] SSL certificate generated
- [ ] hosts file updated
- [ ] `.env` file configured
- [ ] Containers running
- [ ] Can access https://dallal.local
- [ ] Backups configured

---

**That's it! Your homelab dashboard is ready! 🎉**

For detailed documentation, see `HOMELAB_DEPLOYMENT.md`
