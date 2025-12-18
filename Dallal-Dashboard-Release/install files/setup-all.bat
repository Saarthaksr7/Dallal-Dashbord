@echo off
REM ============================================================================
REM Dallal Dashboard - Master Setup Script
REM Opens each setup script in a new window, one at a time
REM ============================================================================

cd /d "%~dp0"

cls
echo ============================================================================
echo.
echo           DALLAL DASHBOARD - COMPLETE SETUP
echo.
echo ============================================================================
echo.
echo This wizard will run each setup step in a new window.
echo Complete each step before continuing to the next.
echo.
echo   Step 1: Install dependencies
echo   Step 2: Configure environment  
echo   Step 3: Fix environment (ensure correct values)
echo   Step 4: Start dashboard
echo.
echo ============================================================================
echo.
pause

REM ============================================================================
REM STEP 1: Install Dependencies
REM ============================================================================

cls
echo ============================================================================
echo STEP 1: INSTALL DEPENDENCIES
echo ============================================================================
echo.
echo Opening install-dependencies.bat in a new window...
echo.
echo WAIT for it to complete, then come back here and press any key.
echo.

start "Dallal - Install Dependencies" cmd /c "install-dependencies.bat"

echo.
pause

REM ============================================================================
REM STEP 2: Configure Environment
REM ============================================================================

cls
echo ============================================================================
echo STEP 2: CONFIGURE ENVIRONMENT
echo ============================================================================
echo.
echo Opening setup-config.bat in a new window...
echo.
echo Choose option 1 (Quick Setup) for fastest setup.
echo WAIT for it to complete, then come back here and press any key.
echo.

start "Dallal - Configure Environment" cmd /c "setup-config.bat"

echo.
pause

REM ============================================================================
REM STEP 3: Fix Environment (Quick Fix)
REM ============================================================================

cls
echo ============================================================================
echo STEP 3: FIX ENVIRONMENT
echo ============================================================================
echo.
echo Opening fix-env.bat in a new window...
echo.
echo This ensures your .env file has all correct values.
echo WAIT for it to complete, then come back here and press any key.
echo.

start "Dallal - Fix Environment" cmd /c "fix-env.bat"

echo.
pause

REM ============================================================================
REM STEP 4: Start Dashboard
REM ============================================================================

cls
echo ============================================================================
echo STEP 4: START DASHBOARD
echo ============================================================================
echo.
echo Opening start-dashboard.bat in a new window...
echo.
echo The dashboard will start and your browser will open.
echo.

start "Dallal Dashboard" cmd /c "start-dashboard.bat"

echo.
echo ============================================================================
echo.
echo                    SETUP COMPLETE!
echo.
echo ============================================================================
echo.
echo The dashboard is now running in another window.
echo.
echo   URL: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo ============================================================================
echo.
pause
