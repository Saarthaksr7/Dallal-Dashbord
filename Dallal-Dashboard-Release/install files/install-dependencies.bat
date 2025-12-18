@echo off
REM ============================================================================
REM Dallal Dashboard - Dependency Installer
REM This script installs all required Python packages from requirements-win.txt
REM ============================================================================

SETLOCAL EnableDelayedExpansion

REM Change to script directory
cd /d "%~dp0"

REM Initialize log file
SET LOGFILE=install.log
echo ======================================== > "%LOGFILE%"
echo Dallal Dashboard - Installation Log >> "%LOGFILE%"
echo Started: %DATE% %TIME% >> "%LOGFILE%"
echo ======================================== >> "%LOGFILE%"
echo. >> "%LOGFILE%"

REM Display banner
cls
echo ============================================================================
echo.
echo           DALLAL DASHBOARD - DEPENDENCY INSTALLER
echo.
echo ============================================================================
echo.
echo This installer will:
echo   [1] Check Python installation
echo   [2] Verify pip is available
echo   [3] Install all required dependencies
echo.
echo All operations will be logged to: install.log
echo.
echo ============================================================================
echo.
pause

REM ============================================================================
REM STEP 1: Check Python Installation
REM ============================================================================

echo.
echo [STEP 1/4] Checking Python installation...
echo [STEP 1/4] Checking Python installation... >> "%LOGFILE%"

python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo.
    echo [ERROR] Python is not installed or not in PATH!
    echo [ERROR] Python is not installed or not in PATH! >> "%LOGFILE%"
    echo.
    echo SOLUTION:
    echo   1. Download Python 3.8 or higher from https://www.python.org/downloads/
    echo   2. During installation, check "Add Python to PATH"
    echo   3. Restart this installer after Python is installed
    echo.
    CALL :exit_with_confirmation
)

REM Get Python version
FOR /F "tokens=2" %%i IN ('python --version 2^>^&1') DO SET PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found
echo [OK] Python %PYTHON_VERSION% found >> "%LOGFILE%"

REM Check Python version (basic check for 3.x)
python -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>nul
IF ERRORLEVEL 1 (
    echo.
    echo [ERROR] Python version is too old!
    echo [ERROR] Python version %PYTHON_VERSION% is too old! >> "%LOGFILE%"
    echo.
    echo SOLUTION:
    echo   - Python 3.8 or higher is required
    echo   - Current version: %PYTHON_VERSION%
    echo   - Please upgrade from https://www.python.org/downloads/
    echo.
    CALL :exit_with_confirmation
)

REM ============================================================================
REM STEP 2: Check pip Installation
REM ============================================================================

echo.
echo [STEP 2/4] Checking pip installation...
echo [STEP 2/4] Checking pip installation... >> "%LOGFILE%"

python -m pip --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo.
    echo [WARNING] pip is not available!
    echo [WARNING] pip is not available! >> "%LOGFILE%"
    echo.
    echo Attempting to install pip...
    echo Attempting to install pip... >> "%LOGFILE%"
    
    python -m ensurepip --default-pip >> "%LOGFILE%" 2>&1
    IF ERRORLEVEL 1 (
        echo [ERROR] Failed to install pip!
        echo [ERROR] Failed to install pip! >> "%LOGFILE%"
        echo.
        echo SOLUTION:
        echo   - Try reinstalling Python with pip included
        echo   - Or manually install pip from https://pip.pypa.io/en/stable/installation/
        echo.
        CALL :exit_with_confirmation
    )
    echo [OK] pip installed successfully
    echo [OK] pip installed successfully >> "%LOGFILE%"
) ELSE (
    FOR /F "tokens=2" %%i IN ('python -m pip --version 2^>^&1') DO SET PIP_VERSION=%%i
    echo [OK] pip %PIP_VERSION% found
    echo [OK] pip %PIP_VERSION% found >> "%LOGFILE%"
)

REM ============================================================================
REM STEP 3: Check/Offer Virtual Environment
REM ============================================================================

echo.
echo [STEP 3/4] Checking virtual environment...
echo [STEP 3/4] Checking virtual environment... >> "%LOGFILE%"

REM Check if we're in a virtual environment
python -c "import sys; exit(0 if sys.prefix != sys.base_prefix else 1)" 2>nul
IF ERRORLEVEL 1 (
    echo.
    echo [INFO] Not currently in a virtual environment
    echo [INFO] Not currently in a virtual environment >> "%LOGFILE%"
    echo.
    echo RECOMMENDATION: Install in a virtual environment to avoid conflicts
    echo.
    echo Options:
    echo   [1] Create and use virtual environment (RECOMMENDED)
    echo   [2] Install globally (may conflict with other Python packages)
    echo.
    SET /P VENV_CHOICE="Enter your choice (1 or 2): "
    
    IF "!VENV_CHOICE!"=="1" (
        echo.
        echo Creating virtual environment...
        echo Creating virtual environment... >> "%LOGFILE%"
        
        python -m venv .venv >> "%LOGFILE%" 2>&1
        IF ERRORLEVEL 1 (
            echo [ERROR] Failed to create virtual environment!
            echo [ERROR] Failed to create virtual environment! >> "%LOGFILE%"
            echo.
            echo SOLUTION:
            echo   - Ensure you have write permissions in this directory
            echo   - Try running as administrator
            echo   - Or choose option 2 to install globally
            echo.
            CALL :exit_with_confirmation
        )
        
        echo [OK] Virtual environment created
        echo [OK] Virtual environment created >> "%LOGFILE%"
        echo.
        echo Activating virtual environment...
        echo Activating virtual environment... >> "%LOGFILE%"
        
        CALL .venv\Scripts\activate.bat
        IF ERRORLEVEL 1 (
            echo [ERROR] Failed to activate virtual environment!
            echo [ERROR] Failed to activate virtual environment! >> "%LOGFILE%"
            CALL :exit_with_confirmation
        )
        
        echo [OK] Virtual environment activated
        echo [OK] Virtual environment activated >> "%LOGFILE%"
    ) ELSE (
        echo.
        echo [INFO] Installing globally
        echo [INFO] Installing globally >> "%LOGFILE%"
    )
) ELSE (
    echo [OK] Already in virtual environment
    echo [OK] Already in virtual environment >> "%LOGFILE%"
)

REM ============================================================================
REM STEP 4: Install Dependencies
REM ============================================================================

echo.
echo [STEP 4/4] Installing dependencies from requirements-win.txt...
echo [STEP 4/4] Installing dependencies from requirements-win.txt... >> "%LOGFILE%"
echo.

REM Check if requirements file exists
IF NOT EXIST "requirements-win.txt" (
    echo [ERROR] requirements-win.txt not found!
    echo [ERROR] requirements-win.txt not found in %CD% >> "%LOGFILE%"
    echo.
    echo SOLUTION:
    echo   - Ensure requirements-win.txt is in the same folder as this installer
    echo   - Current directory: %CD%
    echo.
    CALL :exit_with_confirmation
)

echo This may take several minutes depending on your internet connection...
echo Please wait...
echo.

REM Upgrade pip first
echo Upgrading pip...
python -m pip install --upgrade pip >> "%LOGFILE%" 2>&1
IF ERRORLEVEL 1 (
    echo [WARNING] Failed to upgrade pip, continuing with current version...
    echo [WARNING] Failed to upgrade pip >> "%LOGFILE%"
) ELSE (
    echo done:- pip upgrade
    echo.
)

REM Install dependencies one by one with progress
echo Installing packages...
echo ----------------------------------------
echo.

REM Counter for installed packages
SET /A INSTALLED_COUNT=0
SET /A FAILED_COUNT=0

REM Read requirements file line by line
FOR /F "usebackq tokens=* delims=" %%A IN ("requirements-win.txt") DO (
    SET "LINE=%%A"
    
    REM Skip empty lines
    IF NOT "!LINE!"=="" (
        REM Skip comment lines (starting with #)
        SET "FIRST_CHAR=!LINE:~0,1!"
        IF NOT "!FIRST_CHAR!"=="#" (
            REM Strip inline comments (everything after #)
            FOR /F "tokens=1 delims=#" %%C IN ("!LINE!") DO SET "CLEAN_LINE=%%C"
            
            REM Trim trailing spaces from CLEAN_LINE
            FOR /L %%i IN (1,1,100) DO IF "!CLEAN_LINE:~-1!"==" " SET "CLEAN_LINE=!CLEAN_LINE:~0,-1!"
            
            REM Extract package name (before >= or [ or any version specifier)
            FOR /F "tokens=1 delims=><=[ " %%B IN ("!CLEAN_LINE!") DO (
                SET "PACKAGE_NAME=%%B"
                
                REM Trim trailing spaces from package name
                FOR /L %%i IN (1,1,100) DO IF "!PACKAGE_NAME:~-1!"==" " SET "PACKAGE_NAME=!PACKAGE_NAME:~0,-1!"
                
                REM Skip if package name is empty or just whitespace
                IF NOT "!PACKAGE_NAME!"=="" (
                    echo installing:- !PACKAGE_NAME!
                    echo installing:- !PACKAGE_NAME! >> "%LOGFILE%"
                    
                    REM Install the package with cleaned specification (no comments)
                    python -m pip install "!CLEAN_LINE!" >> "%LOGFILE%" 2>&1
                    
                    IF ERRORLEVEL 1 (
                        echo [ERROR] Failed to install !PACKAGE_NAME!
                        echo [ERROR] Failed to install !PACKAGE_NAME! >> "%LOGFILE%"
                        SET /A FAILED_COUNT+=1
                        echo.
                    ) ELSE (
                        echo done:- !PACKAGE_NAME!
                        echo done:- !PACKAGE_NAME! >> "%LOGFILE%"
                        SET /A INSTALLED_COUNT+=1
                        echo.
                    )
                )
            )
        )
    )
)

echo ----------------------------------------
echo.
echo Installation Summary:
echo   Successfully installed: !INSTALLED_COUNT! packages
echo   Failed: !FAILED_COUNT! packages
echo.
echo Installation Summary: >> "%LOGFILE%"
echo   Successfully installed: !INSTALLED_COUNT! packages >> "%LOGFILE%"
echo   Failed: !FAILED_COUNT! packages >> "%LOGFILE%"

REM Check if any packages failed
IF !FAILED_COUNT! GTR 0 (
    echo.
    echo [ERROR] Some packages failed to install!
    echo [ERROR] Some packages failed to install! >> "%LOGFILE%"
    echo.
    echo Check install.log for detailed error messages.
    echo.
    echo COMMON SOLUTIONS:
    echo   - Ensure you have an active internet connection
    echo   - Some packages may require Microsoft Visual C++ Build Tools
    echo   - Try running as administrator
    echo   - Check if your antivirus is blocking the installation
    echo.
    SET /P RETRY="Would you like to retry failed packages? (y/n): "
    IF /I "!RETRY!"=="y" (
        echo.
        echo Retrying installation...
        python -m pip install -r requirements-win.txt >> "%LOGFILE%" 2>&1
        IF ERRORLEVEL 1 (
            echo [ERROR] Installation failed again!
            echo [ERROR] Retry failed >> "%LOGFILE%"
            CALL :exit_with_confirmation
        ) ELSE (
            echo [OK] Retry successful!
            echo [OK] Retry successful! >> "%LOGFILE%"
        )
    ) ELSE (
        CALL :exit_with_confirmation
    )
)

echo.
echo ----------------------------------------

REM ============================================================================
REM SUCCESS! Display Summary
REM ============================================================================

echo.
echo ============================================================================
echo.
echo                    INSTALLATION COMPLETED SUCCESSFULLY!
echo.
echo ============================================================================
echo.

REM List installed packages
echo Installed packages:
echo Installed packages: >> "%LOGFILE%"
echo ----------------------------------------
python -m pip list | findstr /C:"fastapi" /C:"uvicorn" /C:"sqlmodel" /C:"docker" /C:"paramiko" /C:"pysnmp"
echo ----------------------------------------
echo.
echo For complete list, run: pip list
echo.

REM Save full package list to log
echo Full installed packages: >> "%LOGFILE%"
python -m pip list >> "%LOGFILE%" 2>&1

echo Installation log saved to: install.log
echo.
echo ============================================================================
echo.
echo NEXT STEPS:
echo   1. Navigate to the backend directory
echo   2. Configure your .env file (copy from .env.example)
echo   3. Run: python main.py
echo   4. Access dashboard at: http://localhost:8000
echo.
echo ============================================================================
echo.
echo Installation completed: %DATE% %TIME% >> "%LOGFILE%"
echo.

pause
EXIT /B 0

REM ============================================================================
REM FUNCTION: Exit with user confirmation
REM ============================================================================
:exit_with_confirmation
echo.
echo ============================================================================
echo Installation failed. Check install.log for details.
echo ============================================================================
echo Installation failed: %DATE% %TIME% >> "%LOGFILE%"
echo.

:exit_loop
SET /P EXIT_CONFIRM="Type 'y' to exit: "
IF /I NOT "%EXIT_CONFIRM%"=="y" (
    echo Please type 'y' to exit
    GOTO exit_loop
)

echo.
echo Exiting...
echo Exiting... >> "%LOGFILE%"
EXIT /B 1
