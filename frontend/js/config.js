// API Configuration
const API_CONFIG = {
    // Change this to your deployed backend URL on Render
    BASE_URL: 'https://pod-app-backend.onrender.com', // Update this with your actual Render URL
    // For local development, use: 'http://localhost:5000'
    
    // Full API base path
    get API_BASE() {
        return `${this.BASE_URL}/api`;
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;
