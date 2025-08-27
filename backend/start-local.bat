@echo off
echo.
echo ===========================================
echo   PodcastAI - Local MongoDB Setup
echo ===========================================
echo.

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB not found in PATH
    echo.
    echo Please install MongoDB Community Server from:
    echo https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB found in PATH

REM Check if MongoDB service is running
sc query "MongoDB" | find "RUNNING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB service is running
    goto :start_app
)

echo ⚠️ MongoDB service is not running
echo Attempting to start MongoDB service...

REM Try to start MongoDB service
net start MongoDB >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB service started successfully
    goto :start_app
)

echo ❌ Failed to start MongoDB service
echo.
echo Please try one of the following:
echo 1. Run this script as Administrator
echo 2. Start MongoDB manually: net start MongoDB
echo 3. Install MongoDB as a Windows service
echo.
pause
exit /b 1

:start_app
echo.
echo Starting PodcastAI backend server...
echo.
echo MongoDB Connection: mongodb://localhost:27017/podcast-app
echo Server URL: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm start
