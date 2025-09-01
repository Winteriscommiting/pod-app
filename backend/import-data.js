const mongoose = require('mongoose');
const fs = require('fs');

// Your MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://podcastuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/podcast-app?retryWrites=true&w=majority';

async function importData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('Connected successfully');
    
    // Read exported data
    const exportedData = JSON.parse(fs.readFileSync('./data-export.json', 'utf8'));
    
    const db = mongoose.connection.db;
    
    // Import each collection
    for (const [collectionName, documents] of Object.entries(exportedData)) {
      if (documents.length > 0) {
        console.log(`Importing ${documents.length} documents to ${collectionName}...`);
        await db.collection(collectionName).insertMany(documents);
        console.log(`✅ ${collectionName} imported successfully`);
      }
    }
    
    console.log('🎉 All data imported successfully!');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run only if you provide the correct Atlas URI above
if (ATLAS_URI.includes('YOUR_USERNAME')) {
  console.log('Please update ATLAS_URI with your actual MongoDB Atlas connection string');
  process.exit(1);
} else {
  importData();
}
