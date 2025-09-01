# Podcast App - Production Setup Guide

## Real-Time Implementation Completed ✅

This guide helps you configure the podcast application with real Text-to-Speech providers for production use.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** database connection
3. **API Keys** for at least one TTS provider

## 🔧 Environment Configuration

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Configure Database
```env
MONGODB_URI=mongodb://localhost:27017/podcast-app
```

### 3. Configure JWT
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 4. Choose and Configure TTS Provider

#### Option A: OpenAI (Recommended)
```env
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Option B: ElevenLabs (Premium Quality)
```env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

#### Option C: AWS Polly (Enterprise)
```env
TTS_PROVIDER=aws
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
```

## 🚀 TTS Provider Setup

### OpenAI Setup
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an API key
3. Available voices: alloy, echo, fable, onyx, nova, shimmer
4. Cost: ~$15 per 1M characters

### ElevenLabs Setup
1. Visit [ElevenLabs](https://elevenlabs.io)
2. Get API key from dashboard
3. Supports voice cloning
4. Cost: Various plans starting at $5/month

### AWS Polly Setup
1. Create AWS account
2. Setup IAM user with Polly permissions
3. Multiple voice options and languages
4. Cost: $4 per 1M characters

## 📁 Directory Structure
```
backend/
├── uploads/
│   ├── audio/          # Generated TTS audio files
│   ├── documents/      # Uploaded documents
│   ├── podcasts/       # Final podcast files
│   └── voice-samples/  # Custom voice samples
```

## 🔧 Installation & Startup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Start Production Server
```bash
npm start
```

## 🎯 Features Now Available

### ✅ Real TTS Generation
- Actual audio file generation
- Multiple provider support
- Voice customization
- Speed/pitch control

### ✅ Document Processing
- PDF text extraction
- DOCX text extraction
- TXT file processing
- Word count analysis

### ✅ Voice Management
- Browse available AI voices
- Test voices with sample text
- Upload custom voice samples
- Voice cloning (ElevenLabs)

### ✅ Podcast Creation
- Real-time audio generation
- Progress tracking
- File management
- Download/streaming

## 🔐 Security Features

### JWT Authentication
- Secure user sessions
- Token-based auth
- Protected API endpoints

### File Upload Security
- File type validation
- Size limits
- Secure storage

## 📡 API Endpoints

### Voice Management
```
GET  /api/voice/available    # Get all available voices
POST /api/voice/test         # Test voice with sample text
GET  /api/voice/audio/:id    # Stream generated audio
POST /api/voice/upload       # Upload voice sample
```

### Document Processing
```
POST /api/documents/upload   # Upload and process document
GET  /api/documents          # Get user documents
DELETE /api/documents/:id    # Delete document
```

### Podcast Generation
```
POST /api/podcasts           # Create podcast from document
GET  /api/podcasts           # Get user podcasts
GET  /api/podcasts/:id       # Get podcast details
DELETE /api/podcasts/:id     # Delete podcast
```

## 🐛 Troubleshooting

### No TTS Provider Configured
- Check environment variables
- Verify API key validity
- Ensure TTS_PROVIDER is set correctly

### Audio Generation Fails
- Check API key permissions
- Verify text length limits
- Check network connectivity

### File Upload Issues
- Check upload directory permissions
- Verify file size limits
- Ensure supported file types

## 📊 Monitoring

### Error Logs
- Check console for TTS errors
- Monitor API rate limits
- Track file storage usage

### Performance
- Monitor API response times
- Track audio generation speed
- Watch memory usage for large files

## 🔄 Backup & Recovery

### Database Backup
```bash
mongodump --uri="mongodb://localhost:27017/podcast-app"
```

### File Backup
Backup the entire `uploads/` directory regularly.

## 📞 Support

For issues with:
- **OpenAI**: Check [OpenAI Status](https://status.openai.com/)
- **ElevenLabs**: Visit [ElevenLabs Support](https://elevenlabs.io/support)
- **AWS**: Check [AWS Status](https://status.aws.amazon.com/)

---

## 🎉 You're Ready!

Your podcast application now has real-time TTS capabilities. Upload documents, select voices, and generate actual podcast audio files!
