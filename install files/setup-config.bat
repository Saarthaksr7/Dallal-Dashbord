@echo off
REM ============================================================================
REM Dallal Dashboard - Environment Configuration Wizard
REM This script helps you configure your .env file interactively
REM ============================================================================

SETLOCAL EnableDelayedExpansion

REM Change to script directory
cd /d "%~dp0"

REM Set backend directory (one level up)
SET BACKEND_DIR=..\backend
SET ENV_FILE=%BACKEND_DIR%\.env
SET ENV_EXAMPLE=%BACKEND_DIR%\.env.example
SET LOG_FILE=config.log

REM Initialize log
echo ======================================== > "%LOG_FILE%"
echo Dallal Dashboard - Configuration Log >> "%LOG_FILE%"
echo Started: %DATE% %TIME% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Display welcome banner
cls
echo ============================================================================
echo.
echo           DALLAL DASHBOARD - ENVIRONMENT CONFIGURATOR
echo.
echo ============================================================================
echo.
echo This wizard will help you configure your Dallal Dashboard settings.
echo.
echo Setup Types:
echo   [1] Quick Setup (5 minutes) - Recommended for getting started
echo       - Uses secure defaults
echo       - Auto-generates secret keys
echo       - SQLite database (no setup needed)
echo.
echo   [2] Custom Setup (10 minutes) - Configure common settings
echo       - Choose database type
echo       - Configure email/SMTP
echo       - Set security options
echo.
echo   [3] Advanced Setup (15 minutes) - Full configuration
echo       - All available options
echo       - Redis, monitoring, backups
echo       - Security policies
echo.
echo Press Ctrl+C anytime to cancel
echo.
echo ============================================================================
echo.

REM Check if .env exists
IF EXIST "%ENV_FILE%" (
    echo [WARNING] An existing .env file was found!
    echo.
    SET /P BACKUP_CHOICE="Would you like to backup the existing file? (y/n): "
    IF /I "!BACKUP_CHOICE!"=="y" (
        CALL :backup_env
    )
    echo.
    SET /P OVERWRITE="Continue and overwrite existing .env? (y/n): "
    IF /I NOT "!OVERWRITE!"=="y" (
        echo.
        echo Configuration cancelled by user.
        pause
        EXIT /B 0
    )
)

REM Get setup type
:get_setup_type
echo.
echo Setup Types:
echo   [1] Quick Setup (5 minutes) - Recommended for getting started
echo       - Uses secure defaults
echo       - Auto-generates secret keys
echo       - SQLite database (no setup needed)
echo.
echo   [2] Custom Setup (10 minutes) - Configure common settings
echo       - Choose database type
echo       - Configure email/SMTP
echo       - Set security options
echo.
echo   [3] Advanced Setup (15 minutes) - Full configuration
echo       - All available options
echo       - Redis, monitoring, backups
echo       - Security policies
echo.
SET /P SETUP_TYPE="Enter your choice (1, 2, or 3): "

IF "%SETUP_TYPE%"=="1" (
    echo [INFO] Quick Setup selected >> "%LOG_FILE%"
    CALL :quick_setup
) ELSE IF "%SETUP_TYPE%"=="2" (
    echo [INFO] Custom Setup selected >> "%LOG_FILE%"
    CALL :custom_setup
) ELSE IF "%SETUP_TYPE%"=="3" (
    echo [INFO] Advanced Setup selected >> "%LOG_FILE%"
    CALL :advanced_setup
) ELSE (
    echo.
    echo [ERROR] Invalid choice. Please enter 1, 2, or 3.
    echo.
    GOTO get_setup_type
)

REM Show summary and confirm
CALL :show_summary

SET /P CONFIRM="Confirm and save configuration? (y/n): "
IF /I NOT "%CONFIRM%"=="y" (
    echo.
    echo Configuration cancelled. No changes were made.
    pause
    EXIT /B 0
)

REM Save configuration
CALL :save_config

echo.
echo ============================================================================
echo.
echo                    CONFIGURATION SAVED SUCCESSFULLY!
echo.
echo ============================================================================
echo.
echo Configuration file created at: %ENV_FILE%
echo.
echo NEXT STEPS:
echo   1. Review your .env file if needed
echo   2. Run: python ..\backend\main.py
echo   3. Access dashboard at: http://localhost:8000
echo.
echo ============================================================================
echo.
echo Configuration completed: %DATE% %TIME% >> "%LOG_FILE%"

pause
EXIT /B 0

REM ============================================================================
REM FUNCTION: Quick Setup
REM ============================================================================
:quick_setup
echo.
echo ============================================================================
echo QUICK SETUP
echo ============================================================================
echo.
echo Setting up with recommended defaults...
echo.

REM Basic settings
SET CONFIG_PROJECT_NAME=Dallal Dashboard
SET CONFIG_ENVIRONMENT=production
SET CONFIG_API_PREFIX=/api/v1

REM Generate secret keys
echo Generating secure secret keys...
CALL :generate_secret_key
SET CONFIG_SECRET_KEY=!GENERATED_KEY!

CALL :generate_secret_key
SET CONFIG_REFRESH_SECRET_KEY=!GENERATED_KEY!

REM Token settings
SET CONFIG_ACCESS_TOKEN_EXPIRE=480
SET CONFIG_REFRESH_TOKEN_EXPIRE=7

REM Database
SET CONFIG_DATABASE_URL=sqlite:///./dallal.db

REM CORS
SET CONFIG_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]

REM Server
SET CONFIG_SERVER_HOST=0.0.0.0
SET CONFIG_SERVER_PORT=8000

REM Features
SET CONFIG_REDIS_ENABLED=false
SET CONFIG_EMAIL_ENABLED=false
SET CONFIG_RATE_LIMIT_ENABLED=true
SET CONFIG_RATE_LIMIT_PER_MIN=60

REM Logging
SET CONFIG_LOG_LEVEL=INFO
SET CONFIG_LOG_FORMAT=json

REM Security
SET CONFIG_MAX_LOGIN_ATTEMPTS=5
SET CONFIG_LOCKOUT_DURATION=15
SET CONFIG_PASSWORD_MIN_LENGTH=8

REM Services
SET CONFIG_MDNS_ENABLED=true
SET CONFIG_BACKUP_ENABLED=true

echo [OK] Configuration prepared with defaults
echo.
EXIT /B 0

REM ============================================================================
REM FUNCTION: Custom Setup
REM ============================================================================
:custom_setup
echo.
echo ============================================================================
echo CUSTOM SETUP
echo ============================================================================
echo.

REM Application Settings
echo --- Application Settings ---
echo.
CALL :prompt_with_default "Project Name" "Dallal Dashboard" CONFIG_PROJECT_NAME

:get_environment
echo.
echo Environment type:
echo   [1] development
echo   [2] production (recommended)
echo   [3] staging
SET /P ENV_CHOICE="Enter choice (1-3) [2]: "
IF "%ENV_CHOICE%"=="" SET ENV_CHOICE=2
IF "%ENV_CHOICE%"=="1" SET CONFIG_ENVIRONMENT=development
IF "%ENV_CHOICE%"=="2" SET CONFIG_ENVIRONMENT=production
IF "%ENV_CHOICE%"=="3" SET CONFIG_ENVIRONMENT=staging
IF NOT DEFINED CONFIG_ENVIRONMENT (
    echo Invalid choice!
    GOTO get_environment
)

REM Security Settings
echo.
echo --- Security Settings ---
echo.
echo Generating secure secret keys...
CALL :generate_secret_key
SET CONFIG_SECRET_KEY=!GENERATED_KEY!
CALL :generate_secret_key
SET CONFIG_REFRESH_SECRET_KEY=!GENERATED_KEY!
echo [OK] Secret keys generated

echo.
CALL :prompt_with_default "Access Token Expire (minutes)" "480" CONFIG_ACCESS_TOKEN_EXPIRE
CALL :prompt_with_default "Refresh Token Expire (days)" "7" CONFIG_REFRESH_TOKEN_EXPIRE

REM Database Settings
echo.
echo --- Database Settings ---
echo.
echo Database type:
echo   [1] SQLite (recommended for development)
echo   [2] PostgreSQL (recommended for production)
echo   [3] MySQL
SET /P DB_CHOICE="Enter choice (1-3) [1]: "
IF "%DB_CHOICE%"=="" SET DB_CHOICE=1

IF "%DB_CHOICE%"=="1" (
    SET CONFIG_DATABASE_URL=sqlite:///./dallal.db
) ELSE IF "%DB_CHOICE%"=="2" (
    CALL :prompt_with_default "PostgreSQL Host" "localhost" PG_HOST
    CALL :prompt_with_default "PostgreSQL Port" "5432" PG_PORT
    CALL :prompt_with_default "PostgreSQL Database" "dallal_db" PG_DB
    CALL :prompt_with_default "PostgreSQL Username" "postgres" PG_USER
    SET /P PG_PASS="PostgreSQL Password: "
    SET CONFIG_DATABASE_URL=postgresql://!PG_USER!:!PG_PASS!@!PG_HOST!:!PG_PORT!/!PG_DB!
) ELSE IF "%DB_CHOICE%"=="3" (
    CALL :prompt_with_default "MySQL Host" "localhost" MYSQL_HOST
    CALL :prompt_with_default "MySQL Port" "3306" MYSQL_PORT
    CALL :prompt_with_default "MySQL Database" "dallal_db" MYSQL_DB
    CALL :prompt_with_default "MySQL Username" "root" MYSQL_USER
    SET /P MYSQL_PASS="MySQL Password: "
    SET CONFIG_DATABASE_URL=mysql://!MYSQL_USER!:!MYSQL_PASS!@!MYSQL_HOST!:!MYSQL_PORT!/!MYSQL_DB!
)

REM Server Settings
echo.
echo --- Server Settings ---
echo.
CALL :prompt_with_default "Server Bind Address" "0.0.0.0" CONFIG_SERVER_HOST
CALL :prompt_with_default "Server Port" "8000" CONFIG_SERVER_PORT

REM Email Settings
echo.
echo --- Email/SMTP Settings ---
echo.
SET /P EMAIL_ENABLE="Enable email notifications? (y/n) [n]: "
IF /I "%EMAIL_ENABLE%"=="y" (
    SET CONFIG_EMAIL_ENABLED=true
    CALL :prompt_with_default "SMTP Host" "smtp.gmail.com" CONFIG_SMTP_HOST
    CALL :prompt_with_default "SMTP Port" "587" CONFIG_SMTP_PORT
    SET /P CONFIG_SMTP_USER="SMTP Username/Email: "
    SET /P CONFIG_SMTP_PASSWORD="SMTP Password: "
    CALL :prompt_with_default "From Email" "noreply@yourdomain.com" CONFIG_SMTP_FROM
    CALL :prompt_with_default "From Name" "Dallal Dashboard" CONFIG_SMTP_FROM_NAME
) ELSE (
    SET CONFIG_EMAIL_ENABLED=false
    SET CONFIG_SMTP_HOST=smtp.gmail.com
    SET CONFIG_SMTP_PORT=587
    SET CONFIG_SMTP_USER=your-email@example.com
    SET CONFIG_SMTP_PASSWORD=your-password
    SET CONFIG_SMTP_FROM=noreply@yourdomain.com
    SET CONFIG_SMTP_FROM_NAME=Dallal Dashboard
)

REM Use defaults for other settings
SET CONFIG_API_PREFIX=/api/v1
SET CONFIG_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]
SET CONFIG_REDIS_ENABLED=false
SET CONFIG_RATE_LIMIT_ENABLED=true
SET CONFIG_RATE_LIMIT_PER_MIN=60
SET CONFIG_LOG_LEVEL=INFO
SET CONFIG_LOG_FORMAT=json
SET CONFIG_MAX_LOGIN_ATTEMPTS=5
SET CONFIG_LOCKOUT_DURATION=15
SET CONFIG_PASSWORD_MIN_LENGTH=8
SET CONFIG_MDNS_ENABLED=true
SET CONFIG_BACKUP_ENABLED=true

echo.
echo [OK] Custom configuration prepared
echo.
EXIT /B 0

REM ============================================================================
REM FUNCTION: Advanced Setup
REM ============================================================================
:advanced_setup
echo.
echo ============================================================================
echo ADVANCED SETUP
echo ============================================================================
echo.
echo Starting with custom setup, then configuring advanced options...
echo.

REM First do custom setup
CALL :custom_setup

REM Additional advanced options
echo.
echo --- Advanced Options ---
echo.

REM Redis
SET /P REDIS_ENABLE="Enable Redis caching? (y/n) [n]: "
IF /I "%REDIS_ENABLE%"=="y" (
    SET CONFIG_REDIS_ENABLED=true
    CALL :prompt_with_default "Redis URL" "redis://localhost:6379/0" CONFIG_REDIS_URL
) ELSE (
    SET CONFIG_REDIS_ENABLED=false
    SET CONFIG_REDIS_URL=redis://localhost:6379/0
)

REM Monitoring
echo.
SET /P SENTRY_ENABLE="Enable Sentry error tracking? (y/n) [n]: "
IF /I "%SENTRY_ENABLE%"=="y" (
    SET /P CONFIG_SENTRY_DSN="Sentry DSN: "
) ELSE (
    SET CONFIG_SENTRY_DSN=
)

REM Logging
echo.
echo Log Level:
echo   [1] DEBUG
echo   [2] INFO (recommended)
echo   [3] WARNING
echo   [4] ERROR
SET /P LOG_CHOICE="Enter choice (1-4) [2]: "
IF "%LOG_CHOICE%"=="" SET LOG_CHOICE=2
IF "%LOG_CHOICE%"=="1" SET CONFIG_LOG_LEVEL=DEBUG
IF "%LOG_CHOICE%"=="2" SET CONFIG_LOG_LEVEL=INFO
IF "%LOG_CHOICE%"=="3" SET CONFIG_LOG_LEVEL=WARNING
IF "%LOG_CHOICE%"=="4" SET CONFIG_LOG_LEVEL=ERROR

REM Security Policies
echo.
echo --- Security Policies ---
CALL :prompt_with_default "Max Login Attempts" "5" CONFIG_MAX_LOGIN_ATTEMPTS
CALL :prompt_with_default "Lockout Duration (minutes)" "15" CONFIG_LOCKOUT_DURATION
CALL :prompt_with_default "Password Min Length" "8" CONFIG_PASSWORD_MIN_LENGTH

REM Backup
echo.
SET /P BACKUP_ENABLE="Enable automated backups? (y/n) [y]: "
IF /I "%BACKUP_ENABLE%"=="n" (
    SET CONFIG_BACKUP_ENABLED=false
) ELSE (
    SET CONFIG_BACKUP_ENABLED=true
    CALL :prompt_with_default "Backup Retention (days)" "30" CONFIG_BACKUP_RETENTION
)

echo.
echo [OK] Advanced configuration prepared
echo.
EXIT /B 0

REM ============================================================================
REM FUNCTION: Generate Secret Key
REM ============================================================================
:generate_secret_key
REM Try using Python first
python -c "import secrets; print(secrets.token_hex(32))" 2>nul
IF ERRORLEVEL 1 (
    REM Fallback: Use PowerShell
    FOR /F "delims=" %%i IN ('powershell -Command "[guid]::NewGuid().ToString().Replace('-','') + [guid]::NewGuid().ToString().Replace('-','')"') DO SET GENERATED_KEY=%%i
) ELSE (
    FOR /F "delims=" %%i IN ('python -c "import secrets; print(secrets.token_hex(32))"') DO SET GENERATED_KEY=%%i
)
EXIT /B 0

REM ============================================================================
REM FUNCTION: Prompt with Default
REM ============================================================================
:prompt_with_default
SET PROMPT_TEXT=%~1
SET PROMPT_DEFAULT=%~2
SET PROMPT_VAR=%~3

SET /P USER_INPUT="%PROMPT_TEXT% [%PROMPT_DEFAULT%]: "
IF "%USER_INPUT%"=="" (
    SET %PROMPT_VAR%=%PROMPT_DEFAULT%
) ELSE (
    SET %PROMPT_VAR%=%USER_INPUT%
)
EXIT /B 0

REM ============================================================================
REM FUNCTION: Backup Existing .env
REM ============================================================================
:backup_env
SET TIMESTAMP=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
SET TIMESTAMP=%TIMESTAMP: =0%
SET BACKUP_FILE=%ENV_FILE%.backup.%TIMESTAMP%

copy "%ENV_FILE%" "%BACKUP_FILE%" >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to backup existing .env file
    echo [ERROR] Failed to backup .env >> "%LOG_FILE%"
) ELSE (
    echo [OK] Backup created: %BACKUP_FILE%
    echo [OK] Backup created: %BACKUP_FILE% >> "%LOG_FILE%"
)
EXIT /B 0

REM ============================================================================
REM FUNCTION: Show Summary
REM ============================================================================
:show_summary
echo.
echo ============================================================================
echo CONFIGURATION SUMMARY
echo ============================================================================
echo.
echo Application:
echo   Project Name: %CONFIG_PROJECT_NAME%
echo   Environment: %CONFIG_ENVIRONMENT%
echo.
echo Security:
echo   Secret Key: ************************ (!CONFIG_SECRET_KEY:~0,8!...)
echo   Access Token Expire: %CONFIG_ACCESS_TOKEN_EXPIRE% minutes
echo.
echo Database:
echo   URL: %CONFIG_DATABASE_URL%
echo.
echo Server:
echo   Host: %CONFIG_SERVER_HOST%
echo   Port: %CONFIG_SERVER_PORT%
echo.
echo Features:
echo   Email: %CONFIG_EMAIL_ENABLED%
echo   Redis: %CONFIG_REDIS_ENABLED%
echo   Backups: %CONFIG_BACKUP_ENABLED%
echo.
echo ============================================================================
echo.
EXIT /B 0

REM ============================================================================
REM FUNCTION: Save Configuration
REM ============================================================================
:save_config
echo.
echo Saving configuration to %ENV_FILE%...
echo Saving configuration... >> "%LOG_FILE%"

REM Ensure all variables have default values (safety check)
IF NOT DEFINED CONFIG_PROJECT_NAME SET CONFIG_PROJECT_NAME=Dallal Dashboard
IF NOT DEFINED CONFIG_API_PREFIX SET CONFIG_API_PREFIX=/api/v1
IF NOT DEFINED CONFIG_ENVIRONMENT SET CONFIG_ENVIRONMENT=production
IF NOT DEFINED CONFIG_ACCESS_TOKEN_EXPIRE SET CONFIG_ACCESS_TOKEN_EXPIRE=480
IF NOT DEFINED CONFIG_REFRESH_TOKEN_EXPIRE SET CONFIG_REFRESH_TOKEN_EXPIRE=7
IF NOT DEFINED CONFIG_DATABASE_URL SET CONFIG_DATABASE_URL=sqlite:///./dallal.db
IF NOT DEFINED CONFIG_SERVER_HOST SET CONFIG_SERVER_HOST=0.0.0.0
IF NOT DEFINED CONFIG_SERVER_PORT SET CONFIG_SERVER_PORT=8000
IF NOT DEFINED CONFIG_CORS_ORIGINS SET CONFIG_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]
IF NOT DEFINED CONFIG_REDIS_ENABLED SET CONFIG_REDIS_ENABLED=false
IF NOT DEFINED CONFIG_RATE_LIMIT_ENABLED SET CONFIG_RATE_LIMIT_ENABLED=true
IF NOT DEFINED CONFIG_RATE_LIMIT_PER_MIN SET CONFIG_RATE_LIMIT_PER_MIN=60
IF NOT DEFINED CONFIG_LOG_LEVEL SET CONFIG_LOG_LEVEL=INFO
IF NOT DEFINED CONFIG_LOG_FORMAT SET CONFIG_LOG_FORMAT=json
IF NOT DEFINED CONFIG_MAX_LOGIN_ATTEMPTS SET CONFIG_MAX_LOGIN_ATTEMPTS=5
IF NOT DEFINED CONFIG_LOCKOUT_DURATION SET CONFIG_LOCKOUT_DURATION=15
IF NOT DEFINED CONFIG_PASSWORD_MIN_LENGTH SET CONFIG_PASSWORD_MIN_LENGTH=8
IF NOT DEFINED CONFIG_MDNS_ENABLED SET CONFIG_MDNS_ENABLED=true
IF NOT DEFINED CONFIG_BACKUP_ENABLED SET CONFIG_BACKUP_ENABLED=true

REM Create .env file
(
echo # Dallal Dashboard - Backend Configuration
echo # Generated by setup-config.bat on %DATE% %TIME%
echo # SECURITY WARNING: Never commit this file to version control!
echo.
echo # ====================
echo # Application Settings
echo # ====================
echo PROJECT_NAME=%CONFIG_PROJECT_NAME%
echo API_V1_STR=%CONFIG_API_PREFIX%
echo ENVIRONMENT=%CONFIG_ENVIRONMENT%
echo.
echo # ====================
echo # Security
echo # ====================
echo SECRET_KEY=%CONFIG_SECRET_KEY%
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=%CONFIG_ACCESS_TOKEN_EXPIRE%
echo REFRESH_TOKEN_EXPIRE_DAYS=%CONFIG_REFRESH_TOKEN_EXPIRE%
echo REFRESH_SECRET_KEY=%CONFIG_REFRESH_SECRET_KEY%
echo.
echo # ====================
echo # Database Configuration
echo # ====================
echo DATABASE_URL=%CONFIG_DATABASE_URL%
echo DB_POOL_SIZE=10
echo DB_MAX_OVERFLOW=20
echo.
echo # ====================
echo # CORS Configuration
echo # ====================
echo BACKEND_CORS_ORIGINS=%CONFIG_CORS_ORIGINS%
echo.
echo # ====================
echo # Redis
echo # ====================
IF DEFINED CONFIG_REDIS_URL (
    echo REDIS_URL=%CONFIG_REDIS_URL%
) ELSE (
    echo REDIS_URL=redis://localhost:6379/0
)
echo REDIS_ENABLED=%CONFIG_REDIS_ENABLED%
echo.
echo # ====================
echo # Rate Limiting
echo # ====================
echo RATE_LIMIT_PER_MINUTE=%CONFIG_RATE_LIMIT_PER_MIN%
echo RATE_LIMIT_ENABLED=%CONFIG_RATE_LIMIT_ENABLED%
echo.
echo # ====================
echo # Logging
echo # ====================
echo LOG_LEVEL=%CONFIG_LOG_LEVEL%
echo LOG_FORMAT=%CONFIG_LOG_FORMAT%
echo LOG_FILE_PATH=./logs/app.log
echo LOG_MAX_BYTES=10485760
echo LOG_BACKUP_COUNT=5
echo.
echo # ====================
echo # Email/SMTP
echo # ====================
IF NOT DEFINED CONFIG_SMTP_HOST SET CONFIG_SMTP_HOST=smtp.gmail.com
IF NOT DEFINED CONFIG_SMTP_PORT SET CONFIG_SMTP_PORT=587
IF NOT DEFINED CONFIG_SMTP_USER SET CONFIG_SMTP_USER=your-email@example.com
IF NOT DEFINED CONFIG_SMTP_PASSWORD SET CONFIG_SMTP_PASSWORD=your-password
IF NOT DEFINED CONFIG_SMTP_FROM SET CONFIG_SMTP_FROM=noreply@yourdomain.com
IF NOT DEFINED CONFIG_SMTP_FROM_NAME SET CONFIG_SMTP_FROM_NAME=Dallal Dashboard
IF NOT DEFINED CONFIG_EMAIL_ENABLED SET CONFIG_EMAIL_ENABLED=false
echo SMTP_HOST=%CONFIG_SMTP_HOST%
echo SMTP_PORT=%CONFIG_SMTP_PORT%
echo SMTP_USER=%CONFIG_SMTP_USER%
echo SMTP_PASSWORD=%CONFIG_SMTP_PASSWORD%
echo SMTP_FROM_EMAIL=%CONFIG_SMTP_FROM%
echo SMTP_FROM_NAME=%CONFIG_SMTP_FROM_NAME%
echo EMAIL_ENABLED=%CONFIG_EMAIL_ENABLED%
echo.
echo # ====================
echo # Monitoring
echo # ====================
IF DEFINED CONFIG_SENTRY_DSN (
    echo SENTRY_DSN=%CONFIG_SENTRY_DSN%
) ELSE (
    echo SENTRY_DSN=
)
echo.
echo # ====================
echo # SSH Configuration
echo # ====================
echo SSH_KEY_PATH=./keys
echo SSH_CONNECTION_TIMEOUT=30
echo MAX_SSH_SESSIONS=10
echo.
echo # ====================
echo # Docker Configuration
echo # ====================
echo DOCKER_HOST=unix:///var/run/docker.sock
echo.
echo # ====================
echo # Service Discovery
echo # ====================
echo MDNS_ENABLED=%CONFIG_MDNS_ENABLED%
echo DISCOVERY_INTERVAL_SECONDS=300
echo.
echo # ====================
echo # Security Policies
echo # ====================
echo MAX_LOGIN_ATTEMPTS=%CONFIG_MAX_LOGIN_ATTEMPTS%
echo LOCKOUT_DURATION_MINUTES=%CONFIG_LOCKOUT_DURATION%
echo SESSION_TIMEOUT_MINUTES=60
echo PASSWORD_MIN_LENGTH=%CONFIG_PASSWORD_MIN_LENGTH%
echo REQUIRE_STRONG_PASSWORD=true
echo.
echo # ====================
echo # File Uploads
echo # ====================
echo MAX_UPLOAD_SIZE_MB=100
echo ALLOWED_UPLOAD_EXTENSIONS=.zip,.tar,.gz,.json
echo.
echo # ====================
echo # Backup Configuration
echo # ====================
echo BACKUP_ENABLED=%CONFIG_BACKUP_ENABLED%
echo BACKUP_SCHEDULE=0 2 * * *
IF DEFINED CONFIG_BACKUP_RETENTION (
    echo BACKUP_RETENTION_DAYS=%CONFIG_BACKUP_RETENTION%
) ELSE (
    echo BACKUP_RETENTION_DAYS=30
)
echo BACKUP_PATH=./backups
echo.
echo # ====================
echo # SNMP Configuration
echo # ====================
echo SNMP_TRAP_PORT=162
echo SNMP_COMMUNITY=public
echo.
echo # ====================
echo # Production Server
echo # ====================
echo WORKER_PROCESSES=4
echo GUNICORN_BIND=%CONFIG_SERVER_HOST%:%CONFIG_SERVER_PORT%
echo GUNICORN_WORKERS=4
echo GUNICORN_WORKER_CLASS=uvicorn.workers.UvicornWorker
) > "%ENV_FILE%"

IF ERRORLEVEL 1 (
    echo [ERROR] Failed to save configuration!
    echo [ERROR] Failed to save configuration >> "%LOG_FILE%"
    CALL :exit_with_confirmation
) ELSE (
    echo [OK] Configuration saved successfully
    echo [OK] Configuration saved >> "%LOG_FILE%"
)

EXIT /B 0

REM ============================================================================
REM FUNCTION: Exit with Confirmation
REM ============================================================================
:exit_with_confirmation
echo.
echo ============================================================================
echo Configuration failed. Check config.log for details.
echo ============================================================================
echo Configuration failed: %DATE% %TIME% >> "%LOG_FILE%"
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
