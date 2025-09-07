const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-app';
    
    // Atlas connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📚 Database: ${conn.connection.name}`);
    
    // Atlas-specific logging
    if (mongoURI.includes('mongodb+srv')) {
      console.log('🌐 Connected to MongoDB Atlas Cloud Database');
    } else {
      console.log('💻 Connected to Local MongoDB Database');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Atlas Connection Failed: Check your cluster URL and network');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Authentication Failed: Check your username and password');
    } else {
      console.log('💡 Make sure MongoDB Atlas is accessible or MongoDB is running locally');
    }
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to local MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  console.log('💡 Ensure MongoDB service is running: mongod');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;