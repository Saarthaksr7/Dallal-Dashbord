$env:ENVIRONMENT = "development"
$env:SECRET_KEY = "dev_secret_key_testing_only"
$env:DATABASE_URL = "sqlite:///./dallal.db"

Write-Host "Starting Backend in Development Mode..."
& "..\.venv\Scripts\python.exe" -m uvicorn main:app --reload
