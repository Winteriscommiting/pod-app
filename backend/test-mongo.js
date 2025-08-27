const mongoose = require('mongoose');

const testMongoDB = async () => {
  try {
    console.log('🔄 Testing local MongoDB connection...');
    
    await mongoose.connect('mongodb://localhost:27017/podcast-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Connected to:', mongoose.connection.host);
    console.log('📚 Database:', mongoose.connection.name);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testMongoDB();