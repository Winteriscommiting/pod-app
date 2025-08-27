# Local MongoDB Setup Guide

## Prerequisites

1. **Install MongoDB Community Server**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow the installation wizard for Windows
   - Make sure to install MongoDB as a Windows Service

2. **Install MongoDB Compass (Optional)**
   - GUI tool for MongoDB management
   - Download from: https://www.mongodb.com/try/download/compass

## Starting MongoDB

### Method 1: Windows Service (Recommended)
MongoDB should start automatically as a Windows service after installation.

To check if it's running:
```powershell
Get-Service -Name MongoDB
```

To start/stop the service:
```powershell
Start-Service -Name MongoDB
Stop-Service -Name MongoDB
```

### Method 2: Command Line
If not running as a service, start manually:
```powershell
# Navigate to MongoDB bin directory (usually)
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
mongod --dbpath "C:\data\db"
```

## Verification

1. **Check if MongoDB is running:**
   ```powershell
   # Test connection
   mongo --eval "db.runCommand({connectionStatus: 1})"
   ```

2. **Using MongoDB Compass:**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`

## Default Configuration

- **Host:** localhost
- **Port:** 27017
- **Database:** podcast-app (will be created automatically)
- **Connection String:** `mongodb://localhost:27017/podcast-app`

## Troubleshooting

1. **Port 27017 already in use:**
   ```powershell
   netstat -ano | findstr :27017
   ```

2. **Data directory doesn't exist:**
   ```powershell
   mkdir "C:\data\db"
   ```

3. **Permission issues:**
   - Run command prompt as Administrator
   - Ensure MongoDB service has proper permissions

## Security (Development)

For local development, no authentication is required by default. The database will be accessible at `mongodb://localhost:27017/podcast-app`.

## Commands Reference

```powershell
# Check MongoDB version
mongod --version

# Connect to MongoDB shell
mongo

# Show databases
show dbs

# Use podcast-app database
use podcast-app

# Show collections
show collections

# Check server status
db.serverStatus()
```
