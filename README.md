# Document-to-Podcast Web Application

A complete open-source web application that converts documents (PDF, DOCX, TXT) into audio podcasts using AI voices, with voice cloning capabilities.

## 🚀 Features

- **Document Processing**: Support for PDF, DOCX, and TXT files
- **AI Voice Generation**: Convert text to speech with multiple AI voices
- **Voice Cloning**: Upload voice samples and clone them for personalized podcasts
- **User Authentication**: JWT-based secure authentication
- **Podcast Management**: View, play, and download generated podcasts
- **Responsive UI**: Modern, clean interface built with vanilla JavaScript
- **RESTful API**: Complete backend API for all operations

## 📁 Project Structure

```
podcast-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   ├── podcastController.js
│   │   └── voiceController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   └── Podcast.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── podcasts.js
│   │   └── voice.js
│   ├── services/
│   │   ├── documentProcessor.js
│   │   ├── textToSpeech.js
│   │   └── voiceCloner.js
│   ├── uploads/
│   │   ├── documents/
│   │   ├── audio/
│   │   ├── voices/
│   │   └── voice-samples/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   └── utils.js
│   │   ├── index.html
│   │   ├── dashboard.html
│   │   └── login.html
│   ├── package.json
│   ├── server.js
│   └── .env.example
└── README.md
```

## 🛠 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/podcast-app.git
   cd podcast-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/podcast-app
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 🚀 Quick Start Guide

### 1. Create an Account
- Visit `http://localhost:5000`
- Click "Get Started Free" or "Login"
- Create a new account or sign in

### 2. Upload a Document
- Go to the Documents tab
- Click "Upload Document"
- Select a PDF, DOCX, or TXT file
- Wait for processing to complete

### 3. Create Your First Podcast
- Go to the Podcasts tab
- Click "Create Podcast"
- Select a processed document
- Choose an AI voice or upload your own voice sample
- Generate the podcast

### 4. Listen and Download
- Play the generated podcast directly in the browser
- Download the MP3 file for offline listening

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Document Endpoints

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

document: <file>
```

#### Get User Documents
```http
GET /api/documents
Authorization: Bearer <token>
```

#### Get Specific Document
```http
GET /api/documents/:id
Authorization: Bearer <token>
```

#### Delete Document
```http
DELETE /api/documents/:id
Authorization: Bearer <token>
```

### Podcast Endpoints

#### Create Podcast
```http
POST /api/podcasts
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "document_id",
  "title": "My Podcast",
  "description": "Podcast description",
  "voiceType": "ai",
  "voiceId": "en-US-1"
}
```

#### Get User Podcasts
```http
GET /api/podcasts
Authorization: Bearer <token>
```

#### Stream Podcast
```http
GET /api/podcasts/:id/stream
Authorization: Bearer <token>
```

#### Download Podcast
```http
GET /api/podcasts/:id/download
Authorization: Bearer <token>
```

### Voice Endpoints

#### Upload Voice Sample
```http
POST /api/voice/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

voiceSample: <audio_file>
name: "My Voice"
```

#### Get Available Voices
```http
GET /api/voice/available
Authorization: Bearer <token>
```

#### Test Voice
```http
POST /api/voice/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "voiceType": "ai",
  "voiceId": "en-US-1",
  "text": "Test text"
}
```

## 🎯 Features in Detail

### Document Processing
- **PDF Support**: Extract text from PDF documents using pdf-parse
- **DOCX Support**: Process Word documents with mammoth
- **TXT Support**: Direct text file processing
- **Word Count**: Automatic word counting for duration estimation
- **Status Tracking**: Real-time processing status updates

### Voice Generation
- **AI Voices**: Multiple high-quality AI voices in different languages
- **Voice Cloning**: Upload voice samples for personalized voices
- **Quality Control**: Multiple audio quality options
- **Format Support**: MP3 output with customizable bitrates

### User Management
- **Secure Authentication**: JWT-based authentication
- **Password Hashing**: Bcrypt password encryption
- **User Preferences**: Customizable audio settings
- **Session Management**: Secure session handling

### Audio Features
- **Streaming**: Real-time audio streaming
- **Progressive Download**: Efficient file downloading
- **Audio Player**: Built-in web audio player
- **Duration Estimation**: Automatic podcast duration calculation

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/podcast-app |
| `JWT_SECRET` | JWT signing secret | Required |
| `NODE_ENV` | Environment mode | development |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |

### File Upload Limits

| File Type | Max Size | Formats |
|-----------|----------|---------|
| Documents | 10MB | PDF, DOCX, TXT |
| Voice Samples | 50MB | WAV, MP3, M4A, FLAC |

## 🚀 Deployment

### Production Deployment

1. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   export JWT_SECRET=your-production-secret
   export MONGODB_URI=your-production-db-url
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t podcast-app .
docker run -p 5000:5000 -e MONGODB_URI=your-db-url podcast-app
```

## 🧪 Testing

### Manual Testing

1. **Document Upload**
   - Test with different file formats (PDF, DOCX, TXT)
   - Test file size limits
   - Test invalid file formats

2. **Voice Generation**
   - Test AI voice selection
   - Test voice cloning upload
   - Test audio quality options

3. **Authentication**
   - Test user registration
   - Test login/logout
   - Test protected routes

### Automated Testing (Future Enhancement)

```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## 🔒 Security Considerations

### Current Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File type and size validation
- Protected API routes

### Additional Security Recommendations
- Implement rate limiting
- Add CSRF protection
- Use HTTPS in production
- Implement file scanning for malware
- Add input validation middleware

## 🎨 Frontend Features

### Modern UI/UX
- Responsive design for all devices
- Modern CSS Grid and Flexbox layouts
- Smooth animations and transitions
- Intuitive navigation and user flows

### Interactive Elements
- Drag-and-drop file uploads
- Real-time status updates
- Audio player with controls
- Progressive loading states

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## 📊 Performance Optimization

### Backend Optimizations
- Efficient file processing
- Streaming for large files
- Database indexing
- Caching strategies

### Frontend Optimizations
- Minified CSS and JavaScript
- Optimized images and assets
- Lazy loading for content
- Progressive web app features

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   - Ensure MongoDB is running
   - Check connection string in .env

2. **File Upload Fails**
   ```
   Error: File size too large
   ```
   - Check file size limits
   - Ensure uploads directory exists

3. **Audio Generation Fails**
   ```
   Error: TTS generation failed
   ```
   - Check text content is valid
   - Verify voice selection

### Debug Mode

Enable debug logging:
```bash
DEBUG=podcast-app:* npm run dev
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Code Style

- Use ESLint for JavaScript
- Follow conventional commit messages
- Add comments for complex logic
- Write unit tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Text-to-Speech API for voice generation
- MongoDB for database storage
- Express.js for web framework
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review the API documentation

## 🔮 Future Enhancements

### Planned Features
- [ ] Multiple language support
- [ ] Advanced voice cloning AI
- [ ] Batch document processing
- [ ] Custom voice training
- [ ] Audio editing tools
- [ ] Social sharing features
- [ ] Mobile app
- [ ] API webhooks
- [ ] Advanced analytics
- [ ] Team collaboration

### Technical Improvements
- [ ] Unit and integration tests
- [ ] Performance monitoring
- [ ] Advanced caching
- [ ] CDN integration
- [ ] Microservices architecture
- [ ] Real-time notifications
- [ ] Advanced error handling
- [ ] Automated deployments

---

**Built with ❤️ by the PodcastAI Team**
