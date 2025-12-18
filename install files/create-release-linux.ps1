# ============================================================================
# Dallal Dashboard - Linux Release Package Creator (PowerShell)
# Creates a clean ZIP archive for Linux distribution
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "          DALLAL DASHBOARD - LINUX RELEASE CREATOR" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a clean ZIP archive for Linux GitHub release."
Write-Host ""
Write-Host "The package will include:"
Write-Host "  - Backend code"
Write-Host "  - Frontend (pre-built)"
Write-Host "  - Linux install scripts"
Write-Host "  - Documentation"
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$ReleaseName = "Dallal-Dashboard-Release-linux"
$ReleaseDir = Join-Path $ProjectDir $ReleaseName
$ZipFile = Join-Path $ProjectDir "$ReleaseName.zip"

# Clean up
Write-Host ""
Write-Host "[1/6] Cleaning up previous release..." -ForegroundColor Yellow
if (Test-Path $ReleaseDir) { Remove-Item -Recurse -Force $ReleaseDir }
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }
New-Item -ItemType Directory -Path $ReleaseDir | Out-Null
Write-Host "[OK] Clean slate ready" -ForegroundColor Green

# Copy Backend
Write-Host ""
Write-Host "[2/6] Copying backend..." -ForegroundColor Yellow
$BackendDir = Join-Path $ReleaseDir "backend"
New-Item -ItemType Directory -Path $BackendDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $BackendDir "app") | Out-Null

Copy-Item (Join-Path $ProjectDir "backend\main.py") $BackendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "backend\requirements.txt") $BackendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "backend\.env.example") $BackendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "backend\REQUIREMENTS.md") $BackendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "backend\app\*") (Join-Path $BackendDir "app") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Backend copied" -ForegroundColor Green

# Copy Frontend
Write-Host ""
Write-Host "[3/6] Copying frontend..." -ForegroundColor Yellow
$FrontendDir = Join-Path $ReleaseDir "frontend"
New-Item -ItemType Directory -Path $FrontendDir | Out-Null

if (Test-Path (Join-Path $ProjectDir "frontend\dist")) {
    Copy-Item (Join-Path $ProjectDir "frontend\dist") $FrontendDir -Recurse -Force
    Write-Host "[OK] Pre-built frontend copied" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Frontend dist folder not found!" -ForegroundColor Red
}

if (Test-Path (Join-Path $ProjectDir "frontend\src")) {
    Copy-Item (Join-Path $ProjectDir "frontend\src") $FrontendDir -Recurse -Force
}

Copy-Item (Join-Path $ProjectDir "frontend\package.json") $FrontendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "frontend\package-lock.json") $FrontendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "frontend\vite.config.js") $FrontendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "frontend\index.html") $FrontendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "frontend\.env.example") $FrontendDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "frontend\README.md") $FrontendDir -ErrorAction SilentlyContinue

Write-Host "[OK] Frontend source copied" -ForegroundColor Green

# Copy Install Files
Write-Host ""
Write-Host "[4/6] Copying Linux install files..." -ForegroundColor Yellow
$InstallDir = Join-Path $ReleaseDir "install files"
New-Item -ItemType Directory -Path $InstallDir | Out-Null

Copy-Item (Join-Path $ScriptDir "install-linux-all.sh") $InstallDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ScriptDir "start-dashboard.sh") $InstallDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ScriptDir "QUICKSTART_LINUX.md") $InstallDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ScriptDir "README_LINUX.md") $InstallDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ScriptDir "CONFIG_GUIDE.md") $InstallDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ScriptDir "INSTALLER_README.md") $InstallDir -ErrorAction SilentlyContinue

Write-Host "[OK] Install files copied" -ForegroundColor Green

# Copy Documentation
Write-Host ""
Write-Host "[5/6] Copying documentation..." -ForegroundColor Yellow

Copy-Item (Join-Path $ProjectDir "README.md") $ReleaseDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir "LICENSE") $ReleaseDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectDir ".gitignore") $ReleaseDir -ErrorAction SilentlyContinue

# Create INSTALL_LINUX.md
$InstallGuide = @"
# Dallal Dashboard - Linux Installation Guide

## Quick Start

1. Extract: ``unzip Dallal-Dashboard-Release-linux.zip``
2. Run installer: ``cd "install files" && chmod +x install-linux-all.sh && ./install-linux-all.sh``
3. Choose installation type from the menu

See QUICKSTART_LINUX.md and README_LINUX.md for detailed instructions.
"@

$InstallGuide | Out-File -FilePath (Join-Path $ReleaseDir "INSTALL_LINUX.md") -Encoding UTF8

Write-Host "[OK] Documentation copied" -ForegroundColor Green

# Create ZIP
Write-Host ""
Write-Host "[6/6] Creating ZIP archive..." -ForegroundColor Yellow

try {
    Compress-Archive -Path $ReleaseDir -DestinationPath $ZipFile -Force -CompressionLevel Optimal
    Write-Host "[OK] ZIP archive created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create ZIP: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Get file size
$FileSize = (Get-Item $ZipFile).Length
$FileSizeMB = [math]::Round($FileSize / 1MB, 2)

# Summary
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "                   LINUX RELEASE PACKAGE CREATED!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archive: $ZipFile"
Write-Host "Size: $FileSizeMB MB"
Write-Host "Format: ZIP (compatible with Linux unzip command)"
Write-Host ""
Write-Host "Contents:"
Write-Host "  /backend              - Python backend code"
Write-Host "  /frontend             - React frontend (source + dist)"
Write-Host "  /install files        - Linux installer scripts"
Write-Host "  /README.md            - Project documentation"
Write-Host "  /INSTALL_LINUX.md     - Linux installation guide"
Write-Host "  /LICENSE              - License file"
Write-Host ""
Write-Host "Linux Scripts Included:"
Write-Host "  - install-linux-all.sh    (Main installer with menu)"
Write-Host "  - start-dashboard.sh      (Quick start script)"
Write-Host "  - QUICKSTART_LINUX.md     (Quick reference)"
Write-Host "  - README_LINUX.md         (Detailed guide)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Upload '$ReleaseName.zip' to GitHub Releases"
Write-Host "  2. Linux users extract with: unzip $ReleaseName.zip"
Write-Host "  3. Then run: cd 'install files' && ./install-linux-all.sh"
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup
$Cleanup = Read-Host "Remove temporary release folder? (y/n)"
if ($Cleanup -eq 'y') {
    Remove-Item -Recurse -Force $ReleaseDir
    Write-Host "[OK] Cleanup complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "Release package ready at: $ZipFile" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
