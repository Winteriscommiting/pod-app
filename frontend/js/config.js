// API Configuration
const API_CONFIG = {
    // Change this to your deployed backend URL
    BASE_URL: 'https://your-backend-app.onrender.com',
    // For local development, use: 'http://localhost:5000'
    
    // Full API base path
    get API_BASE() {
        return `${this.BASE_URL}/api`;
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;
