// Frontend Configuration - ATLAS PRODUCTION
const API_CONFIG = {
    // Production API Base URL (Update with your deployed backend)
    BASE_URL: 'https://your-backend-url.onrender.com/api', // Update this with your actual backend URL
    
    // Fallback to local development
    FALLBACK_URL: 'http://localhost:5000/api',
    
    // Auto-detect environment
    get API_BASE_URL() {
        // Check if we're in production (deployed)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return this.BASE_URL;
        }
        // Use local development server
        return this.FALLBACK_URL;
    },
    
    // Health check and connectivity test
    async testConnection() {
        try {
            console.log('🔍 Testing backend connectivity...');
            console.log('🌐 Testing URL:', this.API_BASE_URL);
            
            const response = await fetch(`${this.API_BASE_URL.replace('/api', '')}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connected successfully');
                console.log('📊 Server status:', data);
                return true;
            } else {
                console.log('⚠️ Backend responded with error:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ Backend connection failed:', error.message);
            console.log('💡 Make sure your backend server is running');
            return false;
        }
    }
};

// Global API base URL
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await API_CONFIG.testConnection();
    if (!isConnected && window.location.hostname !== 'localhost') {
        console.log('🔄 Falling back to local development server...');
        // You might want to show a user-friendly message here
    }
});

console.log('⚙️ Frontend Config Loaded');
console.log('🔗 API Base URL:', API_BASE_URL);
