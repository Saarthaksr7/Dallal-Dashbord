# Platform-Specific Installation Guide

This directory contains multiple requirements files to support different platforms and use cases.

## Requirements Files

### 1. **requirements.txt** (Base/Platform-neutral)
Contains core dependencies that work across all platforms. Use this for basic installations where platform-specific optimizations are not needed.

**Installation:**
```bash
pip install -r requirements.txt
```

### 2. **requirements-win.txt** (Windows)
Optimized for Windows environments with Windows-specific packages.

**Includes:**
- `pywin32` - Windows API access for system-level operations
- `colorama` - Enhanced colored terminal output on Windows
- All core dependencies with version pinning

**Installation (Windows):**
```powershell
pip install -r requirements-win.txt
```

### 3. **requirements-linux.txt** (Linux)
Optimized for Linux environments with Linux-specific performance enhancements.

**Includes:**
- `uvloop` - High-performance event loop replacement for asyncio (significant performance boost)
- `setproctitle` - Set process title for better process monitoring
- All core dependencies with version pinning

**Installation (Linux):**
```bash
pip install -r requirements-linux.txt
```

## Quick Start

### For Development

**Windows:**
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements-win.txt
```

**Linux:**
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements-linux.txt
```

### For Production

**Windows:**
```powershell
pip install -r requirements-win.txt --no-cache-dir
```

**Linux:**
```bash
pip install -r requirements-linux.txt --no-cache-dir
```

## Dependency Highlights

### Core Framework
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server with WebSocket support
- **Gunicorn** - Production-grade WSGI server

### Security
- **SlowAPI** - Rate limiting middleware
- **python-jose** - JWT token handling with cryptography
- **Argon2** - Secure password hashing

### Network & Infrastructure
- **Paramiko** - SSH/SFTP client
- **Docker SDK** - Docker container management
- **pysnmp** - SNMP protocol support
- **Zeroconf** - mDNS/DNS-SD service discovery
- **wakeonlan** - Wake-on-LAN support

### Monitoring & Logging
- **Loguru** - Enhanced logging
- **Prometheus FastAPI Instrumentator** - Metrics collection
- **Sentry SDK** - Error tracking and monitoring
- **psutil** - System and process monitoring

### Database Support
- **SQLModel** - SQL database ORM (works with SQLite by default)
- **psycopg2-binary** - PostgreSQL adapter
- **pymysql** - MySQL adapter
- **Redis** - Caching and session storage

## Platform-Specific Notes

### Windows Considerations
- **gunicorn** has limited support on Windows; use `uvicorn` for development
- **pywin32** enables Windows-specific features like service installation
- Path separators and file handling differences are automatically handled

### Linux Optimizations
- **uvloop** provides up to 2-4x performance improvement for async operations
- Native support for all Unix socket operations
- Better process management with `setproctitle`

## Troubleshooting

### Common Issues

**Issue:** `psycopg2-binary` installation fails
**Solution:** Install PostgreSQL development libraries
```bash
# Ubuntu/Debian
sudo apt-get install libpq-dev

# RHEL/CentOS
sudo yum install postgresql-devel
```

**Issue:** `pysnmp` compatibility issues
**Solution:** Ensure you're using Python 3.8+

**Issue:** Docker SDK connection failed
**Solution:** Ensure Docker daemon is running and accessible

## Version Compatibility

- **Python:** 3.8 or higher required
- **OS:** Windows 10+, Ubuntu 20.04+, Debian 11+, RHEL 8+, or equivalent

## Updating Dependencies

To update all dependencies to their latest compatible versions:

**Windows:**
```powershell
pip install -r requirements-win.txt --upgrade
```

**Linux:**
```bash
pip install -r requirements-linux.txt --upgrade
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Paramiko Documentation](http://docs.paramiko.org/)
- [Docker SDK for Python](https://docker-py.readthedocs.io/)
