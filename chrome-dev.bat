@echo off
REM Chrome Dev Profile Launcher
REM Automatically opens Chrome with dev profile (no extensions)

echo.
echo ========================================
echo  CHROME DEV PROFILE LAUNCHER
echo ========================================
echo.
echo Starting Chrome Dev Profile...
echo - No extensions
echo - Clean environment
echo - Perfect for development
echo.

REM Try different Chrome installation paths
set CHROME_PATH=""

REM Check common Chrome paths
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

REM Check if Chrome is found
if %CHROME_PATH%=="" (
    echo ERROR: Chrome not found!
    echo Please install Chrome or update the path in this script.
    pause
    exit /b 1
)

REM Launch Chrome with dev profile
echo Launching Chrome from: %CHROME_PATH%
echo.

REM Create a dedicated dev profile
%CHROME_PATH% --profile-directory="Dev" --no-first-run --disable-sync --new-window http://localhost:3000

echo.
echo Chrome Dev launched successfully!
echo.
pause

