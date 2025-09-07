const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

// Add or update CORS configuration
const cors = require('cors');

// CORS configuration - ATLAS PRODUCTION
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000', 
    'http://localhost:8080',  // For local Python server testing
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:8080',  // For local Python server testing
    'https://winteriscommiting.github.io',
    'https://winteriscommiting.github.io/pod-app',
    'https://pod-app-backend.onrender.com', // Your deployed backend
    'https://your-custom-domain.com' // Add any custom domains
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint for Render (before other routes)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/user', require('./routes/user'));
  app.use('/api/documents', require('./routes/documents'));
  app.use('/api/podcasts', require('./routes/podcasts'));
  app.use('/api/voice', require('./routes/voice'));
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with better error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});