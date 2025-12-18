# Dallal Dashboard - Dependency Installer

## Overview

This installer automatically installs all required Python packages for the Dallal Dashboard on Windows systems.

## What's Included

- **install-dependencies.bat** - Main installer script
- **requirements-win.txt** - List of all required packages
- **install.log** - Created during installation (detailed log file)

## System Requirements

- **Operating System:** Windows 10 or higher
- **Python:** Version 3.8 or higher
- **Internet Connection:** Required for downloading packages
- **Disk Space:** Approximately 500 MB for all dependencies

## How to Use

### Simple Installation (One-Click)

1. **Double-click** `install-dependencies.bat`
2. Follow the on-screen prompts
3. Wait for installation to complete
4. Done!

### What the Installer Does

The installer will automatically:

1. ✅ Check if Python is installed (version 3.8+)
2. ✅ Verify pip (Python package manager) is available
3. ✅ Offer to create a virtual environment (recommended)
4. ✅ Install all required packages from `requirements-win.txt`
5. ✅ Display installation summary
6. ✅ Create detailed log file (`install.log`)

## Installation Options

### Option 1: Virtual Environment (Recommended)

When prompted, choose **option 1** to create a virtual environment. This:
- Keeps dependencies isolated
- Prevents conflicts with other Python projects
- Is the recommended best practice

The installer will create a `.venv` folder in the same directory.

### Option 2: Global Installation

Choose **option 2** to install packages globally across your system.

⚠️ **Warning:** May conflict with other Python packages on your system.

## Error Handling

The installer has robust error handling:

- ❌ **If an error occurs:** The installer will NOT close automatically
- 📝 **Error details:** Saved to `install.log`
- 💡 **Solutions provided:** On-screen guidance for common issues
- 🔄 **Retry option:** Offered for failed installations
- 🚪 **Exit control:** You must type 'y' to exit after an error

### Common Errors & Solutions

#### Error: "Python is not installed or not in PATH"

**Solution:**
1. Download Python from https://www.python.org/downloads/
2. During installation, **check** "Add Python to PATH"
3. Restart the installer

#### Error: "Python version is too old"

**Solution:**
- Upgrade to Python 3.8 or higher
- Download from https://www.python.org/downloads/

#### Error: "Some packages failed to install"

**Possible Solutions:**
1. Check your internet connection
2. Run as administrator (right-click → Run as administrator)
3. Install Microsoft Visual C++ Build Tools if prompted
4. Temporarily disable antivirus
5. Use the retry option when prompted

#### Error: "requirements-win.txt not found"

**Solution:**
- Ensure `requirements-win.txt` is in the same folder as `install-dependencies.bat`

## What Gets Installed

The installer installs the following categories of packages:

### Core Framework
- FastAPI - Web framework
- Uvicorn - ASGI server
- Gunicorn - Production server

### Security & Authentication
- SlowAPI - Rate limiting
- PyJWT - JWT tokens
- Passlib - Password hashing
- Argon2 - Secure hashing

### Database & ORM
- SQLModel - Database ORM
- Pydantic Settings - Configuration

### Network & Infrastructure
- Paramiko - SSH/SFTP
- Docker SDK - Container management
- PySNMP - SNMP protocol
- Zeroconf - Service discovery
- WakeOnLAN - Remote wake

### Monitoring & Logging
- Loguru - Enhanced logging
- Psutil - System monitoring
- Prometheus - Metrics
- Sentry SDK - Error tracking

### Windows-Specific
- PyWin32 - Windows API access
- Colorama - Colored terminal output

**Total:** 30+ packages with all dependencies

## After Installation

### Verify Installation

Run in Command Prompt or PowerShell:
```powershell
python -m pip list
```

You should see all installed packages listed.

### Next Steps

1. Navigate to the backend directory:
   ```powershell
   cd "..\backend"
   ```

2. Configure your environment:
   ```powershell
   copy .env.example .env
   notepad .env
   ```

3. Start the dashboard:
   ```powershell
   python main.py
   ```

4. Access in browser:
   ```
   http://localhost:8000
   ```

## Converting to EXE (Optional)

The `.bat` file works perfectly as-is, but if you prefer an `.exe`:

### Method 1: Using IExpress (Built into Windows)

1. Press `Win + R`, type `iexpress`, press Enter
2. Choose "Create new Self Extraction Directive file"
3. Select "Extract files and run installation command"
4. Add `install-dependencies.bat` and `requirements-win.txt`
5. Set installation program to: `install-dependencies.bat`
6. Choose output location and name: `DallalDashboard-Installer.exe`
7. Click through to finish

### Method 2: Using Bat to Exe Converter

1. Download Bat to Exe Converter (free): http://bat2exe.net/
2. Open the tool
3. Load `install-dependencies.bat`
4. Click "Include" and add `requirements-win.txt`
5. Set icon (optional)
6. Click "Compile"
7. Output: `install-dependencies.exe`

### Method 3: Keep as .BAT

**Advantages:**
- Works identically to .exe
- No conversion needed
- Easier to view/edit the script
- No security warnings from Windows

**Recommendation:** Unless you need an .exe specifically, the .bat file is perfectly fine!

## Troubleshooting

### Virtual Environment Not Activating

If you chose to create a virtual environment but it's not activating:

```powershell
# Manually activate:
.venv\Scripts\activate.bat

# Then install:
python -m pip install -r requirements-win.txt
```

### Permission Denied Errors

Run Command Prompt or PowerShell as Administrator:
1. Right-click on Command Prompt
2. Select "Run as administrator"
3. Navigate to install files folder
4. Run the installer

### Antivirus Blocking Installation

Some antivirus software may block pip installations:
1. Temporarily disable antivirus
2. Run the installer
3. Re-enable antivirus after completion

## Uninstalling

### If Using Virtual Environment
Simply delete the `.venv` folder - all packages are contained there.

### If Installed Globally
```powershell
python -m pip uninstall -r requirements-win.txt -y
```

## Log File

All installation details are saved to `install.log` in the same folder.

**What's logged:**
- Timestamp of installation
- Python version detected
- Pip version
- Virtual environment creation status
- Each package installation result
- Any errors encountered

Useful for troubleshooting or verifying what was installed.

## Support

If you encounter issues:

1. Check `install.log` for detailed error messages
2. Review the "Common Errors & Solutions" section above
3. Ensure you meet all system requirements
4. Try running as administrator
5. Check your internet connection

## File Structure After Installation

```
install files/
├── install-dependencies.bat    ← Main installer
├── requirements-win.txt         ← Package list
├── install.log                  ← Installation log (created)
└── .venv/                       ← Virtual environment (if created)
    ├── Scripts/
    ├── Lib/
    └── Include/
```

## Version Information

- **Installer Version:** 1.0
- **Python Required:** 3.8+
- **Target OS:** Windows 10+
- **Last Updated:** December 2025

---

**Note:** This installer is specifically designed for Windows. For Linux installations, use `requirements-linux.txt` with `pip install -r requirements-linux.txt`.
