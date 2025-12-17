@echo off
REM ============================================================================
REM Dallal Dashboard - Frontend Build Script
REM Rebuilds the React frontend
REM ============================================================================

SETLOCAL EnableDelayedExpansion

cd /d "%~dp0"

SET FRONTEND_DIR=..\frontend

cls
echo ============================================================================
echo.
echo           DALLAL DASHBOARD - FRONTEND BUILD
echo.
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [1/4] Checking Node.js installation...

where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: LTS v18 or v20
    echo.
    pause
    EXIT /B 1
)

FOR /F "tokens=*" %%i IN ('node --version 2^>nul') DO SET NODE_VER=%%i
echo [OK] Node.js %NODE_VER% found

REM Check if npm is available
echo.
echo [2/4] Checking npm...

where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not available!
    echo.
    pause
    EXIT /B 1
)

FOR /F "tokens=*" %%i IN ('npm --version 2^>nul') DO SET NPM_VER=%%i
echo [OK] npm %NPM_VER% found

REM Change to frontend directory
echo.
echo [3/4] Installing dependencies...
echo.

IF NOT EXIST "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory not found!
    echo Expected: %FRONTEND_DIR%
    pause
    EXIT /B 1
)

cd /d "%FRONTEND_DIR%"

echo Current directory: %CD%
echo.
echo Running: npm install --legacy-peer-deps
echo This may take a few minutes...
echo.

CALL npm install --legacy-peer-deps

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm install failed!
    echo Check the errors above.
    echo.
    pause
    EXIT /B 1
)

echo.
echo [OK] Dependencies installed!

REM Build the frontend
echo.
echo [4/4] Building frontend...
echo.
echo Running: npm run build
echo.

CALL npm run build

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    echo Check the errors above.
    echo.
    pause
    EXIT /B 1
)

echo.
echo ============================================================================
echo.
echo                    FRONTEND BUILD SUCCESSFUL!
echo.
echo ============================================================================
echo.
echo The frontend has been rebuilt.
echo.
echo Next step: Run start-dashboard.bat to start the server
echo.
echo ============================================================================
echo.
pause
EXIT /B 0
