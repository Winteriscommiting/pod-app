# 🚀 Deploy to Render.com (Free Hosting)

## Step 1: Deploy Backend (5 minutes)

### 1.1 Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repository: `Winteriscommiting/pod-app`
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`

### 1.3 Set Environment Variables
In Render dashboard, add these:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://podcastapp-user:SecurePass123!@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-app
JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-random-for-security
```

### 1.4 Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for deployment
- Your backend URL will be: `https://YOUR-APP-NAME.onrender.com`

## Step 2: Update Frontend Configuration

### 2.1 Update config.js
Replace the production URL in `docs/js/config.js`:
```javascript
PRODUCTION_URL: 'https://YOUR-ACTUAL-RENDER-URL.onrender.com/api',
```

### 2.2 Commit and Push
```bash
git add .
git commit -m "Update production backend URL"
git push origin main
```

## Step 3: Test GitHub Pages
1. Visit: `https://winteriscommiting.github.io/pod-app/`
2. Try logging in with: `test@example.com` / `password123`
3. Should redirect to dashboard successfully!

## 🔧 Troubleshooting

### Backend Not Responding
- Check Render logs in dashboard
- Ensure environment variables are set correctly
- Backend might take 30 seconds to wake up (free tier)

### CORS Errors
- Verify your GitHub Pages URL is in CORS configuration
- Check browser console for specific error messages

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Ensure IP whitelist includes 0.0.0.0/0 for cloud deployment

## 🎉 Success Indicators
- ✅ Backend responds at `https://your-app.onrender.com/api/health`
- ✅ GitHub Pages loads at `https://winteriscommiting.github.io/pod-app/`
- ✅ Login redirects to dashboard
- ✅ No CORS errors in browser console
