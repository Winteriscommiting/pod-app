# PodcastAI Local MongoDB Setup Script

Write-Host ""
Write-Host "==========================================="
Write-Host "   PodcastAI - Local MongoDB Setup"
Write-Host "==========================================="
Write-Host ""

# Check if MongoDB is installed
try {
    $mongoVersion = mongod --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB found in PATH" -ForegroundColor Green
    } else {
        throw "MongoDB not found"
    }
} catch {
    Write-Host "❌ MongoDB not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB Community Server from:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if MongoDB service is running
try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction Stop
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MongoDB service is not running" -ForegroundColor Yellow
        Write-Host "Attempting to start MongoDB service..." -ForegroundColor Yellow
        
        try {
            Start-Service -Name "MongoDB"
            Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start MongoDB service" -ForegroundColor Red
            Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
} catch {
    Write-Host "⚠️ MongoDB service not found" -ForegroundColor Yellow
    Write-Host "Trying to start MongoDB manually..." -ForegroundColor Yellow
    
    # Check if data directory exists
    if (!(Test-Path "C:\data\db")) {
        Write-Host "Creating data directory: C:\data\db" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "C:\data\db" -Force
    }
    
    Write-Host "Starting MongoDB manually on port 27017..." -ForegroundColor Yellow
    Write-Host "Note: Keep this window open while using the application" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting PodcastAI backend server..." -ForegroundColor Green
Write-Host ""
Write-Host "MongoDB Connection: mongodb://localhost:27017/podcast-app" -ForegroundColor Cyan
Write-Host "Server URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to script directory and start the application
Set-Location $PSScriptRoot
npm start
