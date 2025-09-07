# Deploy Backend to Render.com

## Quick Setup (5 minutes):

1. **Create Render Account**:
   - Go to https://render.com
   - Sign up with GitHub (free)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Winteriscommiting/pod-app`
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Environment Variables**:
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://podcastapp-user:SecurePass123!@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-app
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   ```

4. **Your Backend URL will be**:
   `https://pod-app-backend.onrender.com`

## Alternative: Railway.app
- Similar setup, also free tier
- URL format: `https://pod-app-backend.railway.app`

## Alternative: Heroku
- Requires credit card (even for free tier)
- URL format: `https://pod-app-backend.herokuapp.com`
