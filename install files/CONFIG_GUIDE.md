# Environment Configuration Wizard - User Guide

## Overview

The `setup-config.bat` script is an interactive wizard that helps you configure your Dallal Dashboard environment settings through a user-friendly menu system.

## Quick Start

### Running the Wizard

1. Navigate to: `Dallal Dashboard\install files`
2. Double-click: **setup-config.bat**
3. Follow the on-screen prompts

## Setup Modes

### 1. Quick Setup (Recommended) ⚡

**Time:** ~5 minutes  
**Best for:** Getting started quickly, development, testing

**What it does:**
- Uses secure default values for all settings
- Auto-generates cryptographically secure secret keys
- Configures SQLite database (no external database needed)
- Disables optional features (email, Redis)
- Sets production-ready security defaults

**Perfect for:**
- First-time setup
- Development environments
- Quick testing
- Users who want to start immediately

### 2. Custom Setup 🔧

**Time:** ~10 minutes  
**Best for:** Production deployments, specific requirements

**What you configure:**
- Environment type (development/production/staging)
- Database choice (SQLite/PostgreSQL/MySQL)
- Server host and port
- Email/SMTP settings
- Security token expiry times

**Automatic:**
- Secret key generation
- Secure defaults for advanced options
- CORS configuration

**Perfect for:**
- Production deployments
- Custom database setups
- Email notifications needed
- Specific port requirements

### 3. Advanced Setup 🚀

**Time:** ~15 minutes  
**Best for:** Full control, enterprise deployments

**All Custom Setup features plus:**
- Redis caching configuration
- Sentry error tracking
- Custom logging levels
- Security policy customization
- Backup retention settings
- All available configuration options

**Perfect for:**
- Enterprise deployments
- High-traffic applications
- Advanced monitoring requirements
- Custom security policies

## Configuration Process

### Step 1: Choose Setup Type

```
Setup Types:
  [1] Quick Setup (5 minutes) - Recommended for getting started
  [2] Custom Setup (10 minutes) - Configure common settings  
  [3] Advanced Setup (15 minutes) - Full configuration

Enter your choice (1, 2, or 3): _
```

### Step 2: Backup Existing Configuration

If you already have a `.env` file:

```
[WARNING] An existing .env file was found!

Would you like to backup the existing file? (y/n): y
[OK] Backup created: .env.backup.20250117_163045

Continue and overwrite existing .env? (y/n): y
```

**Backup files are saved as:** `.env.backup.YYYYMMDD_HHMMSS`

### Step 3: Configuration Prompts

The wizard will prompt you for settings based on your chosen setup mode.

**Example prompts:**

```
Project Name [Dallal Dashboard]: My Dashboard
Environment type:
  [1] development
  [2] production (recommended)
  [3] staging
Enter choice (1-3) [2]: 2

Generating secure secret keys...
[OK] Secret keys generated

Database type:
  [1] SQLite (recommended for development)
  [2] PostgreSQL (recommended for production)
  [3] MySQL
Enter choice (1-3) [1]: 2

PostgreSQL Host [localhost]: db.example.com
PostgreSQL Port [5432]: 5432
PostgreSQL Database [dallal_db]: my_database
PostgreSQL Username [postgres]: admin
PostgreSQL Password: ********
```

### Step 4: Review Summary

```
============================================================================
CONFIGURATION SUMMARY
============================================================================

Application:
  Project Name: My Dashboard
  Environment: production

Security:
  Secret Key: ************************ (a1b2c3d4...)
  Access Token Expire: 480 minutes

Database:
  URL: postgresql://admin:****@db.example.com:5432/my_database

Server:
  Host: 0.0.0.0
  Port: 8000

Features:
  Email: true
  Redis: false
  Backups: true

============================================================================

Confirm and save configuration? (y/n): _
```

### Step 5: Save and Complete

```
============================================================================

                   CONFIGURATION SAVED SUCCESSFULLY!

============================================================================

Configuration file created at: ..\backend\.env

NEXT STEPS:
  1. Review your .env file if needed
  2. Run: python ..\backend\main.py
  3. Access dashboard at: http://localhost:8000

============================================================================
```

## Configuration Details

### Security Settings

**Secret Keys:**
- Auto-generated using Python's `secrets` module (cryptographically secure)
- Fallback to PowerShell GUID generation if Python unavailable
- 64 characters (32 bytes) of random hex data
- Two separate keys: one for access tokens, one for refresh tokens

**Token Expiry:**
- Access Token: Default 480 minutes (8 hours)
- Refresh Token: Default 7 days
- Customizable in Custom/Advanced setup

### Database Options

#### SQLite (Default)
- **URL Format:** `sqlite:///./dallal.db`
- **Pros:** No setup required, perfect for development
- **Cons:** Not suitable for high-traffic production
- **Best for:** Development, testing, small deployments

#### PostgreSQL (Recommended for Production)
- **URL Format:** `postgresql://user:pass@host:port/database`
- **Pros:** Robust, scalable, production-ready
- **Cons:** Requires PostgreSQL server installation
- **Best for:** Production deployments, multi-user systems

#### MySQL
- **URL Format:** `mysql://user:pass@host:port/database`
- **Pros:** Widely supported, familiar to many
- **Cons:** Requires MySQL server installation
- **Best for:** Existing MySQL infrastructure

### Email/SMTP Settings

**Required for:**
- Email notifications about service status
- Alert emails for failures
- Digest reports

**Common SMTP Providers:**
- **Gmail:** smtp.gmail.com:587 (requires app-specific password)
- **Outlook:** smtp-mail.outlook.com:587
- **SendGrid:** smtp.sendgrid.net:587
- **Custom:** Your own SMTP server

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use that password in the wizard

### Server Settings

**Host:**
- `0.0.0.0` - Bind to all interfaces (default, recommended)
- `127.0.0.1` - Localhost only (more secure, local access only)
- Specific IP - Bind to specific network interface

**Port:**
- Default: `8000`
- Must be available (not in use)
- Consider firewall rules for production  

### Advanced Options

**Redis Caching:**
- Improves performance for frequently accessed data
- Requires Redis server running
- Default URL: `redis://localhost:6379/0`

**Sentry Error Tracking:**
- Real-time error monitoring
- Requires Sentry account
- Enter your Sentry DSN when prompted

**Logging Levels:**
- **DEBUG:** Very detailed, use for troubleshooting
- **INFO:** General information (default, recommended)
- **WARNING:** Only warnings and errors
- **ERROR:** Only errors and critical issues

**Security Policies:**
- Max Login Attempts: How many failed logins before lockout
- Lockout Duration: How long to lock out (minutes)
- Password Min Length: Minimum password characters

## File Locations

```
Dallal Dashboard/
├── install files/
│   ├── setup-config.bat       ← Run this script
│   └── config.log             ← Generated log file
│
└── backend/
    ├── .env.example           ← Template (don't edit)
    ├── .env                   ← Created by wizard ✓
    └── .env.backup.*          ← Auto backups
```

## Generated .env File

The wizard creates a complete `.env` file with all necessary settings:

```env
# Dallal Dashboard - Backend Configuration
# Generated by setup-config.bat on 17-12-2025 17:00:00
# SECURITY WARNING: Never commit this file to version control!

# ====================
# Application Settings
# ====================
PROJECT_NAME=Dallal Dashboard
API_V1_STR=/api/v1
ENVIRONMENT=production

# ====================
# Security
# ====================
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0... (64 chars)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7
REFRESH_SECRET_KEY=x1y2z3a4b5c6d7e8f9g0... (64 chars)

...and many more settings
```

## Troubleshooting

### Issue: "Failed to save configuration"

**Cause:** Insufficient permissions or backend directory not found

**Solutions:**
1. Run Command Prompt as Administrator
2. Check that `backend` folder exists one level up
3. Verify you have write permissions

### Issue: "Secret key generation failed"

**Cause:** Both Python and PowerShell unavailable

**Solution:**
1. Install Python (recommended)
2. Or manually edit .env and set SECRET_KEY to 64-character random string

### Issue: "Existing .env backup failed"

**Cause:** File in use or permission issue

**Solution:**
1. Close any programs editing .env
2. Run as Administrator
3. Manually backup .env before running wizard

### Issue: Database connection fails after setup

**Cause:** Incorrect database credentials or server not running

**Solutions:**
1. Verify database server is running
2. Test connection manually
3. Check credentials in .env file
4. For PostgreSQL: `psql -h host -U user -d database`
5. For MySQL: `mysql -h host -u user -p database`

## Security Best Practices

### ✅ DO:
- ✓ Use Quick Setup for automatic secure key generation
- ✓ Choose production environment for live deployments
- ✓ Keep .env file secure and private
- ✓ Use PostgreSQL/MySQL for production
- ✓ Enable email notifications for critical alerts
- ✓ Set strong, unique SMTP passwords
- ✓ Review generated .env file after setup

### ❌ DON'T:
- ✗ Commit .env file to version control (Git, etc.)
- ✗ Share .env file publicly
- ✗ Use default/example passwords in production
- ✗ Reuse secret keys across environments
- ✗ Give .env file broad read permissions
- ✗ Email or message .env file contents

## Re-running the Wizard

You can run the wizard multiple times:

1. **It will detect existing .env**
2. **Offer to backup** (recommended - say yes!)
3. **Overwrite with new configuration**

**Backup naming:** `.env.backup.20250117_163045`  
Keep recent backups in case you need to restore!

## Manual Editing

If you need to adjust settings later:

1. Open `.env` in text editor (Notepad, VS Code, etc.)
2. Edit the value after the `=` sign
3. Save the file
4. Restart the dashboard for changes to take effect

**Example:**
```env
# Change this:
LOG_LEVEL=INFO

# To this:
LOG_LEVEL=DEBUG
```

## Next Steps After Configuration

1. **Verify .env file:**
   ```powershell
   notepad ..\backend\.env
   ```

2. **Start the dashboard:**
   ```powershell
   cd ..\backend
   python main.py
   ```

3. **Access dashboard:**
   - Open browser: http://localhost:8000
   - API docs: http://localhost:8000/docs

4. **Create admin user** (first time):
   - Use the web interface
   - Or use API endpoints

## Support

If you encounter issues:

1. Check `config.log` in install files directory
2. Verify all prerequisites are installed
3. Review this guide's troubleshooting section
4. Check `.env.example` for reference values

## Configuration Reference

See `backend/.env.example` for:
- Complete list of all available settings
- Detailed comments for each option
- Example values
- Format requirements

---

**Version:** 1.0  
**Last Updated:** December 2025  
**Compatible with:** Dallal Dashboard v2.0+
