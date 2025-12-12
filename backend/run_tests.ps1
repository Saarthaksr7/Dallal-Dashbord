#!/usr/bin/env pwsh
# Test runner with environment setup
$env:ENVIRONMENT = "development"
$env:SECRET_KEY = "test_key_for_pytest_only"
$env:DATABASE_URL = "sqlite:///./test.db"

Write-Host "Running Email Service Tests..." -ForegroundColor Cyan
& "..\.venv\Scripts\python.exe" -m pytest tests/test_email_service.py -v --tb=short

Write-Host "`nTest Summary Complete!" -ForegroundColor Green
