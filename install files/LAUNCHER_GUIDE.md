# Dallal Dashboard - Startup Launcher Guide

## Quick Start

**Double-click `start-dashboard.bat`** - That's it! 🚀

The script will:
1. ✅ Check virtual environment exists
2. ✅ Activate the virtual environment
3. ✅ Verify backend files are present
4. ✅ Check for .env configuration
5. ✅ Start the dashboard server
6. ✅ Open your browser automatically

## What Happens

### Startup Sequence

```
============================================================================
                   DALLAL DASHBOARD - LAUNCHER
============================================================================

Starting Dallal Dashboard...

[1/5] Checking virtual environment...
[OK] Virtual environment found

[2/5] Activating virtual environment...
[OK] Virtual environment activated

[3/5] Checking backend directory...
[OK] Backend found

[4/5] Checking configuration...
[OK] Configuration found

[5/5] Starting Dallal Dashboard server...

============================================================================

Dashboard is starting...

  URL: http://localhost:8000
  API Docs: http://localhost:8000/docs

Opening browser in 3 seconds...
Press Ctrl+C to exit the dashboard

============================================================================

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Browser Opens Automatically

After 3 seconds, your default browser will open to:
- **Dashboard:** http://localhost:8000

The terminal remains open showing server logs.

## Stopping the Dashboard

**Press `Ctrl+C`** in the terminal window

The server will gracefully shut down:
```
INFO:     Shutting down
INFO:     Finished server process
============================================================================
Dashboard server stopped
============================================================================
```

## Prerequisites

Before running the launcher, ensure you have:

1. **Installed Dependencies**
   ```
   Run: install-dependencies.bat
   ```

2. **Configured Environment** (optional but recommended)
   ```
   Run: setup-config.bat
   ```

If you skip configuration, the dashboard will use default settings.

## Error Handling

### Error: Virtual environment not found

```
[ERROR] Virtual environment not found!

SOLUTION:
  1. Run install-dependencies.bat first to install dependencies
  2. Or manually create venv: python -m venv .venv
```

**Fix:** Run `install-dependencies.bat` first.

### Error: Backend directory not found

```
[ERROR] Backend directory not found!

SOLUTION:
  - Ensure script is in 'install files' folder
  - Backend should be at: C:\...\Dallal Dashboard\backend
```

**Fix:** Make sure you're running the script from the `install files` folder.

### Warning: No .env file found

```
[WARNING] No .env file found!

RECOMMENDATION:
  Run setup-config.bat to configure your dashboard

Continue with defaults? (y/n): _
```

**Options:**
- Type `y` to continue with defaults
- Type `n` to cancel and run `setup-config.bat` first

### Error: Port already in use

If you see:
```
Error: [Errno 10048] error while attempting to bind on address
('0.0.0.0', 8000): only one usage of each socket address
```

**Fix:**
1. Another instance is already running - close it
2. Another program is using port 8000 - change port in .env
3. Kill the process: `netstat -ano | findstr :8000`

## Tips & Tricks

### Create Desktop Shortcut

1. Right-click `start-dashboard.bat`
2. Select "Create shortcut"
3. Drag shortcut to Desktop
4. Rename to "Start Dallal Dashboard"

Now you can start the dashboard from your desktop!

### Run on Startup (Optional)

To start dashboard automatically when Windows starts:

1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start-dashboard.bat` in this folder

**Note:** Only do this if you want the dashboard always running.

### Check Logs

All startup operations are logged to: `startup.log`

```powershell
# View log
notepad startup.log

# Or in PowerShell
Get-Content startup.log
```

## What Runs

The launcher executes:
```powershell
# 1. Activate virtual environment
.venv\Scripts\activate.bat

# 2. Change to backend
cd ..\backend

# 3. Start server
python main.py
```

You can do this manually if you prefer!

## Troubleshooting

### Dashboard won't start

**Check:**
1. Is Python installed? `python --version`
2. Are dependencies installed? Check for `.venv` folder
3. Is backend present? Check for `backend\main.py`
4. Check `startup.log` for errors

### Browser doesn't open

The server still started! Manually go to:
- http://localhost:8000

### Can't access from other devices

By default, the server binds to `0.0.0.0:8000`, so it should be accessible.

**To access from another device:**
1. Find your computer's IP: `ipconfig`
2. On other device: http://YOUR_IP:8000
3. Ensure Windows Firewall allows port 8000

### Slow to start

First startup may be slow because:
- Database initialization
- Service discovery
- Background tasks

Subsequent startups are faster!

## Using the Dashboard

Once started:

### Web Interface
- **URL:** http://localhost:8000
- **Login:** Use credentials you create on first run

### API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Features Available
- Service monitoring
- SSH management
- Docker container control
- SNMP trap monitoring
- File transfers (SFTP)
- Wake-on-LAN
- And more!

## Advanced Usage

### Run in Background (Detached)

To run without keeping terminal open:

```powershell
# Using PowerShell
Start-Process -FilePath "start-dashboard.bat" -WindowStyle Hidden
```

Or create a VBS script:
```vbscript
CreateObject("Wscript.Shell").Run "start-dashboard.bat", 0, False
```

### Change Port

Edit `backend\.env`:
```env
# Change from default 8000
GUNICORN_BIND=0.0.0.0:9000
```

Then restart the launcher.

### Development Mode

For auto-reload on code changes:

```powershell
cd ..\backend
python main.py
# Or: uvicorn main:app --reload
```

The launcher uses production mode by default.

## File Structure

```
install files/
├── start-dashboard.bat     ← This launcher
├── startup.log            ← Generated log file
├── .venv/                 ← Virtual environment
│   └── Scripts/
│       └── activate.bat
└── ...

backend/
├── main.py               ← Entry point
├── .env                  ← Configuration
├── app/                  ← Application code
└── ...
```

## Next Steps

After starting the dashboard:

1. **First Time Setup:**
   - Create admin account
   - Add your first service
   - Configure notifications

2. **Explore Features:**
   - Add SSH hosts
   - Monitor Docker containers
   - Set up service discovery

3. **Customize:**
   - Adjust settings in .env
   - Configure email alerts
   - Set up backups

## Support

If you encounter issues:

1. Check `startup.log`
2. Verify all prerequisites
3. Try the manual startup method
4. Check Windows Event Viewer for system errors

---

**Happy monitoring with Dallal Dashboard!** 🎉
