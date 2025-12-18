@echo off
REM ============================================================================
REM Dallal Dashboard - Release Package Creator
REM Creates a clean zip file for GitHub release
REM ============================================================================

SETLOCAL EnableDelayedExpansion

cd /d "%~dp0"

SET PROJECT_DIR=..
SET RELEASE_NAME=Dallal-Dashboard-Release
SET RELEASE_DIR=%PROJECT_DIR%\%RELEASE_NAME%
SET ZIP_FILE=%PROJECT_DIR%\%RELEASE_NAME%.zip

cls
echo ============================================================================
echo.
echo           DALLAL DASHBOARD - RELEASE PACKAGE CREATOR
echo.
echo ============================================================================
echo.
echo This will create a clean zip file for GitHub release.
echo.
echo The package will include:
echo   - Backend code
echo   - Frontend (pre-built)
echo   - Install scripts
echo   - Documentation
echo.
echo The package will EXCLUDE:
echo   - node_modules
echo   - .venv / virtualenv
echo   - .git
echo   - __pycache__
echo   - .env (sensitive data)
echo.
echo ============================================================================
echo.
pause

REM ============================================================================
REM Clean up any previous release folder
REM ============================================================================

echo.
echo [1/6] Cleaning up previous release folder...

IF EXIST "%RELEASE_DIR%" (
    rmdir /s /q "%RELEASE_DIR%" 2>nul
)
IF EXIST "%ZIP_FILE%" (
    del /f /q "%ZIP_FILE%" 2>nul
)

mkdir "%RELEASE_DIR%"

echo [OK] Clean slate ready

REM ============================================================================
REM Copy Backend
REM ============================================================================

echo.
echo [2/6] Copying backend...

mkdir "%RELEASE_DIR%\backend"
mkdir "%RELEASE_DIR%\backend\app"

REM Copy main backend files
copy "%PROJECT_DIR%\backend\main.py" "%RELEASE_DIR%\backend\" >nul
copy "%PROJECT_DIR%\backend\requirements.txt" "%RELEASE_DIR%\backend\" >nul
copy "%PROJECT_DIR%\backend\requirements-win.txt" "%RELEASE_DIR%\backend\" >nul 2>nul
copy "%PROJECT_DIR%\backend\requirements-linux.txt" "%RELEASE_DIR%\backend\" >nul 2>nul
copy "%PROJECT_DIR%\backend\.env.example" "%RELEASE_DIR%\backend\" >nul
copy "%PROJECT_DIR%\backend\REQUIREMENTS.md" "%RELEASE_DIR%\backend\" >nul 2>nul

REM Copy app folder (recursive)
xcopy "%PROJECT_DIR%\backend\app" "%RELEASE_DIR%\backend\app" /E /I /Q >nul

echo [OK] Backend copied

REM ============================================================================
REM Copy Frontend (dist only for production)
REM ============================================================================

echo.
echo [3/6] Copying frontend...

mkdir "%RELEASE_DIR%\frontend"

REM Copy dist folder (pre-built frontend)
IF EXIST "%PROJECT_DIR%\frontend\dist" (
    xcopy "%PROJECT_DIR%\frontend\dist" "%RELEASE_DIR%\frontend\dist" /E /I /Q >nul
    echo [OK] Pre-built frontend copied
) ELSE (
    echo [WARNING] Frontend dist folder not found!
    echo Run build-frontend.bat first to build the frontend.
)

REM Also copy source for those who want to build themselves
mkdir "%RELEASE_DIR%\frontend\src"
xcopy "%PROJECT_DIR%\frontend\src" "%RELEASE_DIR%\frontend\src" /E /I /Q >nul
copy "%PROJECT_DIR%\frontend\package.json" "%RELEASE_DIR%\frontend\" >nul
copy "%PROJECT_DIR%\frontend\package-lock.json" "%RELEASE_DIR%\frontend\" >nul 2>nul
copy "%PROJECT_DIR%\frontend\vite.config.js" "%RELEASE_DIR%\frontend\" >nul
copy "%PROJECT_DIR%\frontend\index.html" "%RELEASE_DIR%\frontend\" >nul
copy "%PROJECT_DIR%\frontend\.env.example" "%RELEASE_DIR%\frontend\" >nul 2>nul
copy "%PROJECT_DIR%\frontend\README.md" "%RELEASE_DIR%\frontend\" >nul 2>nul

echo [OK] Frontend source copied

REM ============================================================================
REM Copy Install Files
REM ============================================================================

echo.
echo [4/6] Copying install files...

mkdir "%RELEASE_DIR%\install files"

REM Copy all bat scripts and docs
copy "install-dependencies.bat" "%RELEASE_DIR%\install files\" >nul
copy "setup-config.bat" "%RELEASE_DIR%\install files\" >nul
copy "setup-all.bat" "%RELEASE_DIR%\install files\" >nul
copy "start-dashboard.bat" "%RELEASE_DIR%\install files\" >nul
copy "fix-env.bat" "%RELEASE_DIR%\install files\" >nul
copy "build-frontend.bat" "%RELEASE_DIR%\install files\" >nul
copy "requirements-win.txt" "%RELEASE_DIR%\install files\" >nul
copy "CONFIG_GUIDE.md" "%RELEASE_DIR%\install files\" >nul 2>nul
copy "LAUNCHER_GUIDE.md" "%RELEASE_DIR%\install files\" >nul 2>nul
copy "INSTALLER_README.md" "%RELEASE_DIR%\install files\" >nul 2>nul
copy "QUICKSTART.md" "%RELEASE_DIR%\install files\" >nul 2>nul

echo [OK] Install files copied

REM ============================================================================
REM Copy Root Documentation
REM ============================================================================

echo.
echo [5/6] Copying documentation...

copy "%PROJECT_DIR%\README.md" "%RELEASE_DIR%\" >nul 2>nul
copy "%PROJECT_DIR%\LICENSE" "%RELEASE_DIR%\" >nul 2>nul
copy "%PROJECT_DIR%\.gitignore" "%RELEASE_DIR%\" >nul 2>nul

echo [OK] Documentation copied

REM ============================================================================
REM Create ZIP file
REM ============================================================================

echo.
echo [6/6] Creating ZIP file...

REM Check if PowerShell Compress-Archive is available
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force" 2>nul

IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PowerShell compression failed. Using alternative method...
    
    REM Try using tar (available in Windows 10+)
    tar -a -c -f "%ZIP_FILE%" -C "%PROJECT_DIR%" "%RELEASE_NAME%" 2>nul
    
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Could not create ZIP file.
        echo Please zip the folder manually: %RELEASE_DIR%
        echo.
        pause
        EXIT /B 1
    )
)

echo [OK] ZIP file created

REM ============================================================================
REM Cleanup and Summary
REM ============================================================================

echo.
echo ============================================================================
echo.
echo                    RELEASE PACKAGE CREATED!
echo.
echo ============================================================================
echo.
echo ZIP File: %ZIP_FILE%
echo Folder: %RELEASE_DIR%
echo.
echo Contents:
echo   /backend         - Python backend code
echo   /frontend        - React frontend (source + dist)
echo   /install files   - Windows installer scripts
echo   /README.md       - Project documentation
echo   /LICENSE         - License file
echo.
echo Next steps:
echo   1. Upload %RELEASE_NAME%.zip to GitHub Releases
echo   2. Users download, extract, and run setup-all.bat
echo.
echo ============================================================================
echo.
pause
EXIT /B 0
