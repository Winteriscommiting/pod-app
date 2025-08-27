# PodcastAI - Local Development Setup

## 🔧 Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB Community Server** (v4.4 or higher)
3. **Git** (for version control)

## 🗄️ MongoDB Local Setup

### Option 1: Automated Setup (Recommended)
Run the setup script:
```powershell
# PowerShell (Recommended)
npm run start-local

# Or using batch file
start-local.bat
```

### Option 2: Manual Setup

1. **Install MongoDB:**
   - Download from: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Install as Windows Service (recommended)

2. **Start MongoDB:**
   ```powershell
   # Check if service is running
   Get-Service -Name MongoDB
   
   # Start the service
   Start-Service -Name MongoDB
   ```

3. **Verify Connection:**
   ```powershell
   # Test MongoDB connection
   mongo --eval "db.runCommand({connectionStatus: 1})"
   ```

## 🚀 Quick Start

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd pod-app/backend
   npm install
   ```

2. **Environment Setup:**
   - Copy `.env.example` to `.env` (if exists)
   - The `.env` file is already configured for local MongoDB

3. **Start the Application:**
   ```powershell
   # Option 1: Using the local setup script
   npm run start-local
   
   # Option 2: Regular start (MongoDB must be running)
   npm start
   
   # Option 3: Development mode with auto-restart
   npm run dev
   ```

## 🔗 Connection Details

- **MongoDB URL:** `mongodb://localhost:27017/podcast-app`
- **Server URL:** `http://localhost:5000`
- **Frontend:** `http://localhost:5000` (served by Express)

## 📁 Database Structure

The application will automatically create the following collections:
- `users` - User accounts and authentication
- `documents` - Uploaded documents metadata
- `podcasts` - Generated podcast information
- `voices` - Voice cloning data

## 🛠️ Development Tools

### MongoDB Management
- **MongoDB Compass:** GUI tool for database management
  - Connection string: `mongodb://localhost:27017`
  - Database: `podcast-app`

### Useful Commands
```powershell
# Check MongoDB status
Get-Service -Name MongoDB

# View MongoDB logs
Get-EventLog -LogName Application -Source MongoDB

# Connect to MongoDB shell
mongo podcast-app

# Show collections
show collections

# View users
db.users.find().pretty()
```

## 🔧 Troubleshooting

### MongoDB Issues

1. **Port 27017 in use:**
   ```powershell
   netstat -ano | findstr :27017
   # Kill the process if needed
   taskkill /PID <process-id> /F
   ```

2. **Service won't start:**
   - Run PowerShell as Administrator
   - Check Windows Event Logs
   - Ensure data directory exists: `C:\data\db`

3. **Connection refused:**
   - Verify MongoDB is running: `Get-Service MongoDB`
   - Check firewall settings
   - Ensure localhost is accessible

### Application Issues

1. **Module not found:**
   ```bash
   npm install
   ```

2. **Port 5000 in use:**
   - Change PORT in `.env` file
   - Or kill the process using port 5000

## 📊 Monitoring

### Check Database Status
```javascript
// Connect to MongoDB shell
mongo podcast-app

// Check database stats
db.stats()

// Check collections
show collections

// Count documents
db.users.countDocuments()
db.documents.countDocuments()
db.podcasts.countDocuments()
```

## 🔐 Security Notes

- Local MongoDB runs without authentication by default
- Only accessible from localhost (127.0.0.1)
- For production, enable authentication and use proper security measures

## 📝 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/podcast-app
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

## 🆘 Support

If you encounter issues:
1. Check MongoDB service status
2. Verify Node.js version compatibility
3. Review console logs for error messages
4. Ensure all dependencies are installed
