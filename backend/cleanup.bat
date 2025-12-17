@echo off
REM ============================================================================
REM Dallal Dashboard - Cleanup/Uninstall Script
REM This script removes build artifacts and optionally the application
REM ============================================================================

echo ============================================
echo Dallal Dashboard - Cleanup
echo ============================================
echo.

REM Change to the script directory
cd /d "%~dp0"

echo This script will clean up build artifacts.
echo.
echo What would you like to clean?
echo 1. Build artifacts only (build, dist folders)
echo 2. Everything including executable (DallalDashboard folder)
echo 3. Cancel
echo.

set /p CHOICE="Enter your choice (1-3): "

if "%CHOICE%"=="3" (
    echo Cancelled.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 0
)

if "%CHOICE%"=="1" (
    echo [INFO] Cleaning build artifacts...
    
    if exist "build" (
        rmdir /s /q build
        echo [SUCCESS] Removed build folder
    )
    
    if exist "dist" (
        rmdir /s /q dist
        echo [SUCCESS] Removed dist folder
    )
    
    if exist "*.pyc" (
        del /s /q *.pyc >nul 2>&1
        echo [SUCCESS] Removed Python cache files
    )
    
    if exist "__pycache__" (
        for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
        echo [SUCCESS] Removed __pycache__ folders
    )
    
    echo.
    echo [SUCCESS] Build artifacts cleaned!
)

if "%CHOICE%"=="2" (
    echo.
    echo [WARNING] This will remove the executable and all data!
    echo Are you sure? This cannot be undone! (Y/N)
    set /p CONFIRM="> "
    
    if /i "%CONFIRM%"=="Y" (
        echo [INFO] Removing everything...
        
        if exist "build" (
            rmdir /s /q build
            echo [SUCCESS] Removed build folder
        )
        
        if exist "dist" (
            rmdir /s /q dist
            echo [SUCCESS] Removed dist folder
        )
        
        if exist "DallalDashboard" (
            rmdir /s /q DallalDashboard
            echo [SUCCESS] Removed DallalDashboard folder
        )
        
        if exist "*.pyc" (
            del /s /q *.pyc >nul 2>&1
            echo [SUCCESS] Removed Python cache files
        )
        
        if exist "__pycache__" (
            for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
            echo [SUCCESS] Removed __pycache__ folders
        )
        
        REM Remove desktop shortcut if it exists
        if exist "%USERPROFILE%\Desktop\Dallal Dashboard.lnk" (
            del "%USERPROFILE%\Desktop\Dallal Dashboard.lnk"
            echo [SUCCESS] Removed desktop shortcut
        )
        
        echo.
        echo [SUCCESS] Complete cleanup finished!
    ) else (
        echo Cancelled.
    )
)

echo.
echo Press any key to exit...
pause >nul
