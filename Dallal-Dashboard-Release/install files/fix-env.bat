@echo off
REM ============================================================================
REM Quick Fix: Create Working .env File
REM This script creates a working .env file with all required values
REM ============================================================================

SETLOCAL EnableDelayedExpansion

cd /d "%~dp0"

SET BACKEND_DIR=..\backend
SET ENV_FILE=%BACKEND_DIR%\.env

cls
echo ============================================================================
echo.
echo                    ENV FILE FIX SCRIPT
echo.
echo ============================================================================
echo.
echo This script will create a working .env file with default values.
echo.

REM Delete old broken .env if it exists
IF EXIST "%ENV_FILE%" (
    echo [INFO] Removing old .env file...
    del /F /Q "%ENV_FILE%" 2>nul
)

echo [INFO] Creating new .env file with correct values...
echo.

REM Create complete .env file with all values
(
echo # Dallal Dashboard - Backend Configuration
echo # Auto-generated on %DATE% %TIME%
echo # SECURITY WARNING: Never commit this file to version control!
echo.
echo PROJECT_NAME=Dallal Dashboard
echo API_V1_STR=/api/v1
echo ENVIRONMENT=development
echo SECRET_KEY=change_this_to_a_secure_random_string_minimum_32_chars
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=480
echo REFRESH_TOKEN_EXPIRE_DAYS=7
echo REFRESH_SECRET_KEY=change_this_to_another_secure_random_string_32
echo DATABASE_URL=sqlite:///./dallal.db
echo DB_POOL_SIZE=10
echo DB_MAX_OVERFLOW=20
echo BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]
echo REDIS_URL=redis://localhost:6379/0
echo REDIS_ENABLED=false
echo RATE_LIMIT_PER_MINUTE=60
echo RATE_LIMIT_ENABLED=true
echo LOG_LEVEL=INFO
echo LOG_FORMAT=json
echo LOG_FILE_PATH=./logs/app.log
echo LOG_MAX_BYTES=10485760
echo LOG_BACKUP_COUNT=5
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=your-email@example.com
echo SMTP_PASSWORD=your-password
echo SMTP_FROM_EMAIL=noreply@yourdomain.com
echo SMTP_FROM_NAME=Dallal Dashboard
echo EMAIL_ENABLED=false
echo ALERT_EMAIL_RECIPIENTS=admin@yourdomain.com
echo WEBHOOK_URL=
echo SENTRY_DSN=
echo SSH_KEY_PATH=./keys
echo SSH_CONNECTION_TIMEOUT=30
echo MAX_SSH_SESSIONS=10
echo DOCKER_HOST=unix:///var/run/docker.sock
echo MDNS_ENABLED=true
echo DISCOVERY_INTERVAL_SECONDS=300
echo MAX_LOGIN_ATTEMPTS=5
echo LOCKOUT_DURATION_MINUTES=15
echo SESSION_TIMEOUT_MINUTES=60
echo PASSWORD_MIN_LENGTH=8
echo REQUIRE_STRONG_PASSWORD=true
echo MAX_UPLOAD_SIZE_MB=100
echo ALLOWED_UPLOAD_EXTENSIONS=.zip,.tar,.gz,.json
echo BACKUP_ENABLED=true
echo BACKUP_SCHEDULE=0 2 * * *
echo BACKUP_RETENTION_DAYS=30
echo BACKUP_PATH=./backups
echo SNMP_TRAP_PORT=162
echo SNMP_COMMUNITY=public
echo WORKER_PROCESSES=4
echo GUNICORN_BIND=0.0.0.0:8000
echo GUNICORN_WORKERS=4
echo GUNICORN_WORKER_CLASS=uvicorn.workers.UvicornWorker
) > "%ENV_FILE%"

IF ERRORLEVEL 1 (
    echo [ERROR] Failed to create .env file!
    echo.
    pause
    EXIT /B 1
)

echo [OK] .env file created successfully!
echo.
echo File location: %ENV_FILE%
echo.
echo ============================================================================
echo.
echo NEXT STEP: Run start-dashboard.bat to start the server
echo.
echo ============================================================================
echo.

pause
EXIT /B 0
