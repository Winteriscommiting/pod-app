// Working server with real authentication
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Robust MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://podcastapp-user:SecurePass123!@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-app',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ Connected to MongoDB Atlas');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit, continue with app startup
    return null;
  }
};

// Connect to database
connectDB();

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check - simple and reliable
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    message: 'Pod App Backend Running'
  });
});

// Login endpoint with better error handling
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // For test user, always create if not exists
    if (email === 'test@example.com' && password === 'password123') {
      let user = await User.findOne({ email }).catch(() => null);
      
      if (!user) {
        try {
          const hashedPassword = await bcrypt.hash('password123', 10);
          user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword
          });
          await user.save();
          console.log('✅ Created test user');
        } catch (createError) {
          console.log('Test user might already exist:', createError.message);
          user = await User.findOne({ email }).catch(() => null);
        }
      }
      
      if (user) {
        const token = jwt.sign(
          { id: user._id }, 
          process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
          { expiresIn: '30d' }
        );
        
        return res.json({
          success: true,
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    }
    
    // Regular login flow
    const user = await User.findOne({ email }).catch(() => null);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    const existingUser = await User.findOne({ email }).catch(() => null);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

// Catch all other routes
app.get('*', (req, res) => {
  res.json({ 
    message: 'Pod App Backend API', 
    status: 'running',
    endpoints: ['/api/health', '/api/auth/login', '/api/auth/register']
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: /api/health`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server closed gracefully');  
    process.exit(0);
  });
});

module.exports = app;
