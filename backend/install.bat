@echo off
REM ============================================================================
REM Dallal Dashboard - Installation Script
REM This script helps set up the Dallal Dashboard for first-time use
REM ============================================================================

echo ============================================
echo Dallal Dashboard - Installation
echo ============================================
echo.

REM Change to the script directory
cd /d "%~dp0"

echo This script will:
echo 1. Check if the executable exists
echo 2. Set up configuration files
echo 3. Create necessary directories
echo 4. Create desktop shortcut (optional)
echo.

REM Check if DallalDashboard folder exists
if not exist "DallalDashboard" (
    echo [ERROR] DallalDashboard folder not found!
    echo Please run build_exe.bat first to build the executable.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if executable exists
if not exist "DallalDashboard\DallalDashboard.exe" (
    echo [ERROR] DallalDashboard.exe not found!
    echo Please run build_exe.bat first to build the executable.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [SUCCESS] Executable found!
echo.

REM Create logs directory if it doesn't exist
if not exist "DallalDashboard\logs" (
    echo [INFO] Creating logs directory...
    mkdir "DallalDashboard\logs"
)

REM Setup .env file
if not exist "DallalDashboard\.env" (
    if exist "DallalDashboard\.env.example" (
        echo [INFO] Creating .env from .env.example...
        copy "DallalDashboard\.env.example" "DallalDashboard\.env" >nul
        echo [SUCCESS] .env file created. Please edit it with your settings.
    ) else (
        echo [WARNING] No .env.example found. Using default settings.
    )
) else (
    echo [INFO] .env file already exists.
)
echo.

REM Setup database
if not exist "DallalDashboard\dallal.db" (
    echo [INFO] Database will be created on first run.
) else (
    echo [INFO] Database already exists.
)
echo.

REM Ask about desktop shortcut
echo Would you like to create a desktop shortcut? (Y/N)
set /p CREATE_SHORTCUT="> "

if /i "%CREATE_SHORTCUT%"=="Y" (
    echo [INFO] Creating desktop shortcut...
    
    REM Create VBS script to create shortcut
    echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
    echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Dallal Dashboard.lnk" >> CreateShortcut.vbs
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
    echo oLink.TargetPath = "%~dp0start_dallal.bat" >> CreateShortcut.vbs
    echo oLink.WorkingDirectory = "%~dp0" >> CreateShortcut.vbs
    echo oLink.Description = "Dallal Dashboard - Network Management Tool" >> CreateShortcut.vbs
    echo oLink.Save >> CreateShortcut.vbs
    
    cscript //nologo CreateShortcut.vbs
    del CreateShortcut.vbs
    
    echo [SUCCESS] Desktop shortcut created!
)
echo.

echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Edit DallalDashboard\.env with your configuration
echo 2. Run start_dallal.bat to start the server
echo 3. Access the dashboard at http://localhost:8000
echo.
echo Press any key to exit...
pause >nul
