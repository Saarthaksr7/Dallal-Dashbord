@echo off
REM ============================================================================
REM Dallal Dashboard - Startup Launcher
REM One-click script to start the dashboard
REM ============================================================================

SETLOCAL EnableDelayedExpansion

REM Change to script directory
cd /d "%~dp0"

REM Set paths
SET BACKEND_DIR=..\backend
SET VENV_DIR=.venv
SET LOG_FILE=startup.log

REM Initialize log
echo ======================================== > "%LOG_FILE%"
echo Dallal Dashboard - Startup Log >> "%LOG_FILE%"
echo Started: %DATE% %TIME% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Display banner
cls
echo ============================================================================
echo.
echo                    DALLAL DASHBOARD - LAUNCHER
echo.
echo ============================================================================
echo.
echo Starting Dallal Dashboard...
echo.

REM ============================================================================
REM STEP 1: Check Virtual Environment
REM ============================================================================

echo [1/5] Checking virtual environment...
echo [1/5] Checking virtual environment... >> "%LOG_FILE%"

IF EXIST "%VENV_DIR%\Scripts\activate.bat" (
    echo [OK] Virtual environment found
    echo [OK] Virtual environment found >> "%LOG_FILE%"
) ELSE (
    echo [ERROR] Virtual environment not found!
    echo [ERROR] Virtual environment not found >> "%LOG_FILE%"
    echo.
    echo SOLUTION:
    echo   1. Run install-dependencies.bat first to install dependencies
    echo   2. Or manually create venv: python -m venv .venv
    echo.
    CALL :exit_with_confirmation
)

REM ============================================================================
REM STEP 2: Activate Virtual Environment
REM ============================================================================

echo [2/5] Activating virtual environment...
echo [2/5] Activating virtual environment... >> "%LOG_FILE%"

CALL %VENV_DIR%\Scripts\activate.bat
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to activate virtual environment!
    echo [ERROR] Failed to activate venv >> "%LOG_FILE%"
    echo.
    echo SOLUTION:
    echo   - Try running as administrator
    echo   - Reinstall virtual environment
    echo.
    CALL :exit_with_confirmation
)

echo [OK] Virtual environment activated
echo [OK] Virtual environment activated >> "%LOG_FILE%"

REM ============================================================================
REM STEP 3: Check Backend Directory
REM ============================================================================

echo [3/5] Checking backend directory...
echo [3/5] Checking backend directory... >> "%LOG_FILE%"

IF EXIST "%BACKEND_DIR%\main.py" (
    echo [OK] Backend found
    echo [OK] Backend found >> "%LOG_FILE%"
) ELSE (
    echo [ERROR] Backend directory not found!
    echo [ERROR] Backend not found at %CD%\%BACKEND_DIR% >> "%LOG_FILE%"
    echo.
    echo SOLUTION:
    echo   - Ensure script is in 'install files' folder
    echo   - Backend should be at: %CD%\%BACKEND_DIR%
    echo.
    CALL :exit_with_confirmation
)

REM ============================================================================
REM STEP 4: Check Configuration
REM ============================================================================

echo [4/6] Checking configuration...
echo [4/6] Checking configuration... >> "%LOG_FILE%"

IF EXIST "%BACKEND_DIR%\.env" (
    echo [OK] Configuration found
    echo [OK] Configuration found >> "%LOG_FILE%"
) ELSE (
    echo [WARNING] No .env file found!
    echo [WARNING] No .env file found >> "%LOG_FILE%"
    echo.
    echo RECOMMENDATION:
    echo   Run setup-config.bat to configure your dashboard
    echo.
    SET /P CONTINUE="Continue with defaults? (y/n): "
    IF /I NOT "!CONTINUE!"=="y" (
        echo.
        echo Startup cancelled. Please run setup-config.bat first.
        echo.
        pause
        EXIT /B 0
    )
)

REM ============================================================================
REM STEP 5: Verify Packages Installed
REM ============================================================================

echo [5/6] Verifying packages are installed...
echo [5/6] Verifying packages... >> "%LOG_FILE%"

REM Try to import fastapi to check if packages are installed
python -c "import fastapi" 2>nul
IF ERRORLEVEL 1 (
    echo [ERROR] Required packages not found in virtual environment!
    echo [ERROR] Packages not installed in venv >> "%LOG_FILE%"
    echo.
    echo SOLUTION:
    echo   The virtual environment exists but packages aren't installed in it.
    echo   This usually means:
    echo     - Packages were installed globally instead of in venv
    echo     - Installation was incomplete
    echo.
    echo   FIX: Run install-dependencies.bat again and choose option 1
    echo.
    CALL :exit_with_confirmation
)

echo [OK] Packages verified
echo [OK] Packages verified >> "%LOG_FILE%"

REM ============================================================================
REM STEP 6: Start Dashboard
REM ============================================================================

echo [6/6] Starting Dallal Dashboard server...
echo [6/6] Starting server... >> "%LOG_FILE%"
echo.
echo ============================================================================
echo.
echo Dashboard is starting...
echo.
echo   URL: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Opening browser in 3 seconds...
echo Press Ctrl+C to stop the server
echo.
echo ============================================================================
echo.

REM Wait 3 seconds then open browser
timeout /t 3 /nobreak >nul

REM Open browser (async, don't wait)
start http://localhost:8000 2>nul

REM Change to backend directory
cd /d %BACKEND_DIR%
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to change to backend directory!
    echo [ERROR] Failed to cd to backend >> "%LOG_FILE%"
    cd /d "%~dp0"
    CALL :exit_with_confirmation
)

REM Start the server (this will block until Ctrl+C)
echo Server starting... >> "%LOG_FILE%"
echo.
echo ----------------------------------------
echo SERVER OUTPUT:
echo ----------------------------------------
echo.

python main.py

REM Capture exit code
SET SERVER_EXIT_CODE=%ERRORLEVEL%

REM If we get here, server stopped
echo.
echo ============================================================================
IF %SERVER_EXIT_CODE% EQU 0 (
    echo Dashboard server stopped normally
    echo Server stopped normally: %DATE% %TIME% >> "%LOG_FILE%"
) ELSE (
    echo Dashboard server stopped with error code: %SERVER_EXIT_CODE%
    echo Server stopped with error %SERVER_EXIT_CODE%: %DATE% %TIME% >> "%LOG_FILE%"
)
echo ============================================================================
echo.

pause
EXIT /B %SERVER_EXIT_CODE%

REM ============================================================================
REM FUNCTION: Exit with Confirmation
REM ============================================================================
:exit_with_confirmation
echo.
echo ============================================================================
echo Startup failed. Check startup.log for details.
echo ============================================================================
echo Startup failed: %DATE% %TIME% >> "%LOG_FILE%"
echo.

:exit_loop
SET /P EXIT_CONFIRM="Type 'y' to exit: "
IF /I NOT "%EXIT_CONFIRM%"=="y" (
    echo Please type 'y' to exit
    GOTO exit_loop
)

echo.
echo Exiting...
EXIT /B 1
