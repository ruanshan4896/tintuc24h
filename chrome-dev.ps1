# Chrome Dev Profile Launcher (PowerShell)
# Usage: Right-click → Run with PowerShell
# Or: powershell -ExecutionPolicy Bypass -File chrome-dev.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CHROME DEV PROFILE LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find Chrome installation
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if (-not $chromePath) {
    Write-Host "ERROR: Chrome not found!" -ForegroundColor Red
    Write-Host "Please install Chrome or update the path in this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Chrome found: $chromePath" -ForegroundColor Green
Write-Host ""
Write-Host "Launching Chrome Dev Profile..." -ForegroundColor Yellow
Write-Host "- Profile: Dev (dedicated for development)" -ForegroundColor Gray
Write-Host "- No extensions loaded" -ForegroundColor Gray
Write-Host "- Opening: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Launch Chrome with dev profile
$arguments = @(
    '--profile-directory=Dev',
    '--no-first-run',
    '--disable-sync',
    '--new-window',
    'http://localhost:3000'
)

Start-Process -FilePath $chromePath -ArgumentList $arguments

Write-Host "Chrome Dev launched successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "1. This profile is clean (no extensions)" -ForegroundColor Gray
Write-Host "2. No hydration errors from browser extensions" -ForegroundColor Gray
Write-Host "3. You can install dev-specific extensions if needed" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Yellow
Read-Host

