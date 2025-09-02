require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestUser() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-app';
        await mongoose.connect(mongoURI);
        console.log('📚 Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ email: 'test@example.com' });
        
        if (existingUser) {
            console.log('ℹ️  Test user already exists!');
            console.log('📧 Email: test@example.com');
            console.log('🔑 Password: password123');
            mongoose.disconnect();
            return;
        }

        // Create new test user  
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });

        await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log('📧 Email: test@example.com');
        console.log('🔑 Password: password123');
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
