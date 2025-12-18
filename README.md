# Dallal Dashboard

> **Production-Ready Service Management Platform for Homelabs and Enterprise Environments**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Saarthaksr7/Dallal-Dashbord)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688.svg)](https://fastapi.tiangolo.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Monitoring & Observability](#monitoring--observability)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**Dallal Dashboard** is a comprehensive, enterprise-grade service management platform designed for homelabs, IT operations, and infrastructure monitoring. It provides unified control over services, containers, remote systems, and network infrastructure with real-time monitoring, intelligent alerting, and advanced automation capabilities.

### What Makes Dallal Dashboard Special?

- 🚀 **All-in-One Platform**: Manage services, Docker containers, SSH/RDP sessions, SFTP transfers, and network monitoring from a single interface
- ⚡ **Real-Time Monitoring**: Live service health checks, resource monitoring, and instant notifications
- 🔐 **Security-First**: JWT authentication, rate limiting, audit logging, encrypted credential storage
- 🎨 **Modern UI**: Responsive React interface with dark mode, i18n support (multiple languages), and accessibility features
- 🔧 **Easy Setup**: Automated installation scripts with interactive configuration wizard
- 📊 **Observable**: Built-in Prometheus metrics, Grafana dashboards, and Sentry error tracking
- 🌐 **Network Intelligence**: mDNS/DNS-SD service discovery, Wake-on-LAN, SNMP trap reception
- 🐳 **Docker Native**: Full Docker integration for container lifecycle management

## ✨ Key Features

### Service Management
- **Smart Service Discovery**: Automatic mDNS/DNS-SD network discovery
- **Health Monitoring**: Configurable health checks (HTTP, TCP, ICMP ping)
- **Service Status Engine**: Real-time status updates with WebSocket support
- **Custom Groups & Tags**: Organize services with flexible categorization
- **Favorite Services**: Quick access to frequently used services

### Remote Access
- **SSH Terminal**: Browser-based SSH client with xterm.js
  - Session management and history
  - Custom SSH keys support
  - SFTP file browser with upload/download
  - Saved connection profiles
- **RDP (Remote Desktop)**: Built-in RDP client via Guacamole
  - Session recording and playback
  - Screen sharing capabilities
  - Multi-session management
  - Connection history tracking

### Docker Management
- **Container Lifecycle**: Start, stop, restart, remove containers
- **Real-Time Logs**: Stream container logs with search and filtering
- **Resource Monitoring**: CPU, memory, and network usage tracking
- **Image Management**: Pull, build, and manage Docker images
- **Network & Volume Management**: Complete Docker networking control

### Operations Center
- **Network Topology Visualization**: Interactive network map with reactflow
- **Service Dependency Tracking**: Understand service relationships
- **SNMP Trap Receiver**: Monitor network device events
- **Wake-on-LAN**: Remote system power management
- **Batch Operations**: Execute actions on multiple services

### Monitoring & Alerting
- **Multi-Channel Alerts**: Email, webhooks, in-app notifications
- **Alert Digest**: Hourly, daily, and weekly report summaries
- **Customizable Thresholds**: Define alert rules per service
- **Incident Management**: Track and resolve service incidents
- **Metrics Dashboard**: Real-time charts and historical data

### Advanced Features
- **Version Control Integration**: Track configuration changes with Git
- **Backup & Restore**: Automated database backups with retention policies
- **API Key Management**: Secure third-party integrations
- **Audit Logging**: Complete activity tracking for compliance
- **Webhooks**: Integrate with external systems (Slack, Discord, etc.)
- **App Store**: Discover and deploy pre-configured service templates
- **Report Generation**: Export service status and performance reports

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dallal Dashboard                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │   React Frontend   │────────▶│  FastAPI Backend   │     │
│  │  (Vite + Zustand)  │  HTTP   │   (Python 3.8+)    │     │
│  │                    │◀────────│                    │     │
│  └────────────────────┘ WebSocket└────────────────────┘     │
│           │                              │                   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │   UI Components    │         │  Background Services│     │
│  │  - 24 Pages        │         │  - Status Engine    │     │
│  │  - 63+ Components  │         │  - Discovery Engine │     │
│  │  - i18n Support    │         │  - SNMP Trap Rx     │     │
│  │  - Accessibility   │         │  - Email Scheduler  │     │
│  └────────────────────┘         │  - Guacd Manager    │     │
│                                  └────────────────────┘     │
│                                            │                 │
│                                            ▼                 │
│                                  ┌────────────────────┐     │
│                                  │   Data Layer       │     │
│                                  │  - SQLite/PostgreSQL│    │
│                                  │  - Redis (optional) │     │
│                                  │  - File Storage     │     │
│                                  └────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌────────────────────────────────────┐
         │    External Integrations           │
         ├────────────────────────────────────┤
         │  • Docker Engine (unix socket/tcp) │
         │  • SSH/SFTP Servers (paramiko)     │
         │  • RDP Servers (guacd protocol)    │
         │  • SNMP Devices (trap receiver)    │
         │  • Network Services (mDNS)         │
         │  • Email (SMTP)                    │
         │  • Prometheus/Grafana              │
         │  • Sentry (error tracking)         │
         └────────────────────────────────────┘
```

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI 0.104+ (high-performance async web framework)
- **Server**: Uvicorn (ASGI) / Gunicorn (production)
- **ORM**: SQLModel (SQLAlchemy core with Pydantic models)
- **Database**: SQLite (default) / PostgreSQL / MySQL
- **Caching**: Redis (optional)
- **Task Scheduling**: APScheduler (email digests, cleanup tasks)
- **Authentication**: JWT tokens (PyJWT + python-jose)
- **Password Hashing**: Argon2-CFFI (secure)
- **Rate Limiting**: SlowAPI middleware

### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite 7.2 (fast HMR, optimized builds)
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand 5.0 (simple, scalable)
- **HTTP Client**: Axios 1.13
- **UI Components**: Custom component library
- **Icons**: Lucide React (modern icon set)
- **Terminal**: xterm.js (SSH console)
- **Code Editor**: Monaco Editor (config editing)
- **Charts**: Recharts (metrics visualization)
- **Drag & Drop**: @dnd-kit (service reordering)
- **Flow Diagrams**: ReactFlow (network topology)
- **Internationalization**: i18next + react-i18next
- **Notifications**: React Hot Toast

### Infrastructure & Tools
- **Containerization**: Docker support
- **Reverse Proxy**: Nginx configuration included
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Error Tracking**: Sentry SDK
- **Logging**: Loguru (structured logging)
- **Network**: 
  - Zeroconf (mDNS/DNS-SD discovery)
  - PySNMP (SNMP trap handling)
  - WakeOnLAN (remote power management)
  - Paramiko (SSH/SFTP)
- **System**: psutil (resource monitoring)

### Development Tools
- **Linting**: ESLint 9.39 (frontend)
- **Testing**: Vitest (frontend unit tests)
- **Build Optimization**: Terser, rollup-plugin-visualizer
- **Compression**: vite-plugin-compression2 (gzip/brotli)

## 📦 Installation

### Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16+ and npm (for frontend development)
- **Operating System**: Windows 10+, Ubuntu 20.04+, Debian 11+, RHEL 8+
- **Optional**: Docker (for container management features)
- **Optional**: PostgreSQL/MySQL (for production deployments)
- **Optional**: Redis (for caching and performance)

### Quick Start (Windows)

The easiest way to get started is using the automated installation scripts:

1. **Clone the Repository**
   ```powershell
   git clone https://github.com/Saarthaksr7/Dallal-Dashbord.git
   cd "Dallal Dashbord"
   ```

2. **Run Complete Setup** (Recommended)
   ```powershell
   cd "install files"
   .\setup-all.bat
   ```
   
   This script will:
   - ✅ Install Python dependencies in virtual environment
   - ✅ Build optimized frontend production bundle
   - ✅ Generate secure configuration (.env file)
   - ✅ Launch the dashboard automatically

3. **Access the Dashboard**
   - Open browser: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Default login: Create admin user on first visit

### Manual Installation

#### Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
# Windows:
pip install -r requirements-win.txt
# Linux:
pip install -r requirements-linux.txt

# Configure environment
copy .env.example .env
# Edit .env with your settings (see Configuration section)

# Initialize database and start server
python main.py
```

#### Frontend Setup (Development)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Alternative Installation Methods

#### Individual Components Setup

```powershell
cd "install files"

# 1. Install dependencies only
.\install-dependencies.bat

# 2. Configure environment (interactive wizard)
.\setup-config.bat

# 3. Build frontend
.\build-frontend.bat

# 4. Start dashboard
.\start-dashboard.bat
```

## ⚙️ Configuration

### Configuration Wizard

The easiest way to configure Dallal Dashboard is using the interactive wizard:

```powershell
cd "install files"
.\setup-config.bat
```

**Setup Modes:**
- **Quick Setup** (5 min): Secure defaults, auto-generated keys, SQLite database
- **Custom Setup** (10 min): Choose database, configure email, custom ports
- **Advanced Setup** (15 min): Full control, Redis, Sentry, custom policies

### Manual Configuration

Edit `backend/.env` file with your settings:

```env
# Application
PROJECT_NAME=Dallal Dashboard
ENVIRONMENT=production  # development, staging, production
API_V1_STR=/api/v1

# Security (CRITICAL: Change in production!)
SECRET_KEY=your-64-character-random-string-here
REFRESH_SECRET_KEY=another-64-character-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 hours
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
# SQLite (development):
DATABASE_URL=sqlite:///./dallal.db
# PostgreSQL (production):
# DATABASE_URL=postgresql://user:password@localhost:5432/dallal_db

# CORS (update with your domains)
BACKEND_CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]

# Email/SMTP (optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Redis (optional)
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379/0

# Monitoring
SENTRY_DSN=  # Optional: Sentry error tracking
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# Security Policies
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
PASSWORD_MIN_LENGTH=8
REQUIRE_STRONG_PASSWORD=true

# Service Discovery
MDNS_ENABLED=true
DISCOVERY_INTERVAL_SECONDS=300

# SNMP
SNMP_TRAP_PORT=162
SNMP_COMMUNITY=public

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

See `backend/.env.example` for complete configuration reference.

## 🚀 Usage

### Starting the Dashboard

**Development Mode:**
```powershell
# Backend (with auto-reload)
cd backend
python main.py

# Frontend (separate terminal)
cd frontend
npm run dev
```

**Production Mode:**
```powershell
# Use the launcher script
cd "install files"
.\start-dashboard.bat

# Or manually with Gunicorn (Linux)
cd backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### First-Time Setup

1. **Access Dashboard**: Navigate to `http://localhost:8000`
2. **Create Admin User**: Use the registration interface or API
3. **Configure Services**: Add services via the Services page
4. **Enable Discovery**: Automatic network discovery via mDNS
5. **Setup Alerts**: Configure email notifications in Settings

### Common Tasks

#### Adding a Service
1. Navigate to **Services** page
2. Click **"Add Service"** or use the **Service Wizard**
3. Configure:
   - Name, URL, description
   - Health check settings (HTTP/TCP/Ping)
   - Check intervals and timeouts
   - Tags and groups
4. Save and monitor

#### SSH Connection
1. Go to **SSH Console** page
2. Enter connection details (host, port, username)
3. Choose authentication (password or SSH key)
4. Connect and use full terminal features
5. Access SFTP browser for file management

#### Docker Management
1. Navigate to **Docker** page
2. Configure Docker connection (local unix socket or remote TCP)
3. View containers, images, networks, volumes
4. Start/stop containers, view logs, monitor resources

#### Setting Up Alerts
1. Go to **Settings** → **Alerts**
2. Configure email recipients
3. Set alert thresholds (response time, downtime)
4. Choose digest frequency (hourly/daily/weekly)
5. Test email configuration

## 📚 API Documentation

### Interactive Documentation

Dallal Dashboard provides auto-generated API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### API Endpoints Overview

#### Authentication
```
POST   /api/v1/login          # User login
POST   /api/v1/register       # User registration
POST   /api/v1/refresh        # Refresh access token
GET    /api/v1/me             # Get current user
```

#### Services
```
GET    /api/v1/services                 # List all services
POST   /api/v1/services                 # Create service
GET    /api/v1/services/{id}            # Get service details
PUT    /api/v1/services/{id}            # Update service
DELETE /api/v1/services/{id}            # Delete service
GET    /api/v1/services/{id}/history    # Service health history
POST   /api/v1/services/bulk-action     # Bulk operations
```

#### Docker
```
GET    /api/v1/docker/containers        # List containers
POST   /api/v1/docker/containers/start  # Start container
POST   /api/v1/docker/containers/stop   # Stop container
GET    /api/v1/docker/images            # List images
GET    /api/v1/docker/networks          # List networks
```

#### SSH/SFTP
```
POST   /ssh/connect              # Establish SSH connection
GET    /api/v1/sftp/browse       # Browse SFTP directory
POST   /api/v1/sftp/upload       # Upload file
GET    /api/v1/sftp/download     # Download file
```

#### RDP
```
POST   /api/v1/rdp/connect       # Create RDP session
GET    /api/v1/rdp/sessions      # List active sessions
GET    /api/v1/rdp/recordings    # List session recordings
```

#### Monitoring & Alerts
```
GET    /api/v1/traps             # Get SNMP traps
GET    /api/notifications        # Get notifications
POST   /api/v1/webhooks          # Configure webhooks
GET    /api/v1/reports           # Generate reports
```

#### Settings & Admin
```
GET    /api/v1/settings          # Get settings
PUT    /api/v1/settings          # Update settings
GET    /api/v1/audit             # Audit logs
POST   /api/v1/backup            # Create backup
GET    /api/v1/api-keys          # Manage API keys
```

### Authentication

All API requests (except login/register) require JWT authentication:

```bash
# Login
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Response
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}

# Authenticated Request
curl http://localhost:8000/api/v1/services \
  -H "Authorization: Bearer eyJhbGci..."
```

## 📊 Monitoring & Observability

### Built-in Monitoring

**Prometheus Metrics** (`/metrics` endpoint):
- Request count, latency, error rates
- Service health check metrics
- Database connection pool stats
- Custom application metrics

**Grafana Dashboard**:
Pre-configured dashboard available in `monitoring/grafana-dashboard.json`

**Alert Rules**:
Prometheus alert rules in `monitoring/alert_rules.yml`

### Health Checks

- **Application Health**: `GET /health`
- **Service Status Engine**: Real-time monitoring with configurable intervals
- **WebSocket Updates**: Live status updates pushed to frontend

### Logging

**Structured Logging** with Loguru:
- JSON format (production) or text (development)
- Rotation: 10MB per file, 5 backup files
- Levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Location: `backend/logs/app.log`

**Audit Logging**:
All administrative actions tracked in database

### Error Tracking

**Sentry Integration**:
- Automatic error capture and reporting
- Performance monitoring (10% transaction sampling)
- Release tracking
- Configure via `SENTRY_DSN` in `.env`

## 🔒 Security

### Security Features

- ✅ **JWT Authentication**: Secure token-based auth with refresh tokens
- ✅ **Password Hashing**: Argon2-CFFI (resistant to rainbow tables and GPU attacks)
- ✅ **Rate Limiting**: SlowAPI middleware (60 requests/minute default)
- ✅ **CORS Configuration**: Strict origin validation
- ✅ **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- ✅ **Encrypted Storage**: Credential vault with Fernet encryption
- ✅ **SQL Injection Protection**: SQLModel ORM with parameterized queries
- ✅ **XSS Protection**: React escaping + CSP headers
- ✅ **Audit Logging**: Complete activity tracking
- ✅ **Session Management**: Configurable timeouts and lockouts
- ✅ **Secure File Uploads**: Extension and size validation

### Security Best Practices

**Production Deployment Checklist:**

1. ✅ Change default `SECRET_KEY` to 64+ character random string
2. ✅ Use PostgreSQL/MySQL instead of SQLite
3. ✅ Enable HTTPS (use Nginx reverse proxy)
4. ✅ Configure CORS to only allow your domains
5. ✅ Enable strong password requirements
6. ✅ Set appropriate rate limits
7. ✅ Regular database backups
8. ✅ Keep dependencies updated
9. ✅ Enable Sentry error tracking
10. ✅ Review audit logs regularly

**Never commit to version control:**
- ❌ `.env` file (contains secrets)
- ❌ `secret.key` file (credential vault key)
- ❌ Database files (`*.db`)
- ❌ Log files

## 💻 Development

### Project Structure

```
Dallal Dashboard/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   └── v1/           # Version 1 endpoints
│   │   │       ├── auth.py           # Authentication
│   │   │       ├── services.py       # Service management
│   │   │       ├── docker.py         # Docker API
│   │   │       ├── ssh.py            # SSH terminal
│   │   │       ├── rdp.py            # RDP connections
│   │   │       ├── sftp.py           # SFTP browser
│   │   │       ├── traps.py          # SNMP traps
│   │   │       ├── wol.py            # Wake-on-LAN
│   │   │       ├── webhooks.py       # Webhook management
│   │   │       ├── backup.py         # Backup/restore
│   │   │       ├── keys.py           # SSH key management
│   │   │       ├── api_keys.py       # API key management
│   │   │       ├── audit.py          # Audit logs
│   │   │       ├── vcs.py            # Version control
│   │   │       ├── settings.py       # Settings API
│   │   │       └── reports.py        # Report generation
│   │   ├── core/              # Core functionality
│   │   │   ├── config.py             # Settings management
│   │   │   ├── database.py           # Database connection
│   │   │   ├── logging.py            # Logging setup
│   │   │   └── rate_limit.py         # Rate limiting
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Background services
│   │   │   ├── status_engine.py      # Service monitoring
│   │   │   ├── discovery.py          # mDNS discovery
│   │   │   ├── trap_receiver.py      # SNMP trap listener
│   │   │   ├── email_service.py      # Email notifications
│   │   │   ├── guacd_manager.py      # Guacamole daemon
│   │   │   └── notification.py       # Notification system
│   │   └── utils/             # Utility functions
│   ├── main.py                # Application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Example configuration
│   └── tests/                 # Backend tests
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/             # 24 Page components
│   │   │   ├── Dashboard.jsx         # Main dashboard
│   │   │   ├── Services.jsx          # Service management
│   │   │   ├── Monitoring.jsx        # Metrics & monitoring
│   │   │   ├── Alerts.jsx            # Alert management
│   │   │   ├── SSH.jsx               # SSH terminal
│   │   │   ├── RDP.jsx               # RDP client
│   │   │   ├── Docker.jsx            # Docker management
│   │   │   ├── OpsCenter.jsx         # Operations center
│   │   │   ├── Settings.jsx          # Settings
│   │   │   └── ...
│   │   ├── components/        # 63+ Reusable components
│   │   │   ├── ui/                   # UI primitives
│   │   │   ├── layout/               # Layout components
│   │   │   ├── ssh/                  # SSH components
│   │   │   ├── rdp/                  # RDP components
│   │   │   ├── settings/             # Settings forms
│   │   │   └── ...
│   │   ├── store/             # Zustand state management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Utility functions
│   │   ├── i18n.js            # Internationalization
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json           # NPM dependencies
│   ├── vite.config.js         # Vite configuration
│   └── index.html             # HTML template
│
├── install files/              # Installation utilities
│   ├── setup-all.bat                 # Complete setup
│   ├── install-dependencies.bat     # Install deps
│   ├── setup-config.bat             # Config wizard
│   ├── build-frontend.bat           # Build frontend
│   ├── start-dashboard.bat          # Start server
│   └── CONFIG_GUIDE.md              # Config documentation
│
├── scripts/                    # Utility scripts
│   ├── backup_database.py            # DB backup
│   └── restore_database.py           # DB restore
│
├── monitoring/                 # Monitoring configs
│   ├── prometheus.yml                # Prometheus config
│   ├── alert_rules.yml               # Alert rules
│   └── grafana-dashboard.json        # Grafana dashboard
│
├── nginx.homelab.conf          # Nginx reverse proxy config
├── LICENSE                     # MIT License
└── README.md                   # This file
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Test coverage
npm run test:coverage
```

### Code Style

**Backend (Python)**:
- Follow PEP 8 guidelines
- Type hints for function signatures
- Docstrings for public functions

**Frontend (JavaScript/React)**:
- ESLint configuration provided
- Use functional components with hooks
- PropTypes or TypeScript for component props

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Output: frontend/dist/

# Backend runs directly from source
# Use Gunicorn for production server
```

## 🚢 Deployment

### Docker Deployment

```yaml
# docker-compose.yml example
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dallal
    volumes:
      - ./backend:/app
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dallal
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Nginx Reverse Proxy

Use the included `nginx.homelab.conf` configuration:

```nginx
# HTTPS with SSL termination
# Proxies to backend:8000
# Serves frontend static files
# WebSocket support
# Security headers
```

### Production Checklist

- [ ] SSL/TLS certificates configured (Let's Encrypt recommended)
- [ ] PostgreSQL/MySQL database setup
- [ ] Redis cache configured
- [ ] Environment variables secured
- [ ] Backup automation enabled
- [ ] Monitoring and alerting configured
- [ ] Log rotation setup
- [ ] Firewall rules configured
- [ ] Regular security updates scheduled
- [ ] Performance monitoring active

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Reporting Issues

- Use GitHub Issues
- Provide detailed description
- Include logs and error messages
- Specify environment (OS, Python version, etc.)

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SR7 (Saarthaksr7)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **React** - UI library
- **Vite** - Next-generation frontend tooling
- **Guacamole** - Clientless remote desktop gateway
- **xterm.js** - Terminal emulator for the web
- **Lucide** - Beautiful icon library
- All open-source contributors and maintainers

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Saarthaksr7/Dallal-Dashbord/issues)
- **Documentation**: See `install files/CONFIG_GUIDE.md` for detailed configuration
- **Repository**: [https://github.com/Saarthaksr7/Dallal-Dashbord](https://github.com/Saarthaksr7/Dallal-Dashbord)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Kubernetes integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and predictions
- [ ] Multi-tenancy support
- [ ] Plugin system for extensions
- [ ] Automated incident response workflows
- [ ] Integration with more monitoring tools (Zabbix, Nagios)

---

**Made with ❤️ by SR7 (Saarthaksr7)**  
**Version 1.0.7** | **Last Updated: December 2025**
