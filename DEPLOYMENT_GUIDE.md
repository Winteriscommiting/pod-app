# Deployment Guide for Podcast App

## 📋 Prerequisites
1. MongoDB Atlas account (free)
2. Render account (free)
3. GitHub repository

## 🚀 Deployment Steps

### 1. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster (M0)
3. Create database user:
   - Username: `podcastuser`
   - Password: [Create strong password]
4. Whitelist IP: 0.0.0.0/0 (allow all)
5. Get connection string: 
   ```
   mongodb+srv://podcastuser:PASSWORD@cluster0.xxxxx.mongodb.net/podcast-app
   ```

### 2. Deploy to Render
1. Go to [Render.com](https://render.com/)
2. Connect GitHub repo: `Winteriscommiting/pod-app`
3. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

### 3. Environment Variables (Add in Render)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://podcastuser:PASSWORD@cluster0.xxxxx.mongodb.net/podcast-app
JWT_SECRET=super-secure-production-jwt-secret-key-2024
TTS_PROVIDER=browser
MAX_FILE_SIZE=50MB
BCRYPT_ROUNDS=14
```

### 4. Import Data
After deployment, run locally:
```bash
# Update import-data.js with your Atlas URI
node import-data.js
```

## 📱 Result
Your app will be live at: `https://pod-app.onrender.com`

## 🔧 Troubleshooting
- If database connection fails: Check Atlas whitelist and credentials
- If build fails: Check Node.js version compatibility
- If app crashes: Check Render logs in dashboard

## 💰 Cost
- MongoDB Atlas: FREE (M0 tier)
- Render: FREE (750 hours/month)
- Total: $0/month
