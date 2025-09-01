// API Configuration with environment detection
const API_CONFIG = {
    // Detect if we're running locally or on GitHub Pages
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'  // Local development
        : 'http://localhost:5000',  // For now, always use localhost (will update after Render deployment)
    
    // API endpoints
    ENDPOINTS: {
        auth: '/api/auth',
        documents: '/api/documents', 
        podcasts: '/api/podcasts',
        summaries: '/api/documents/summaries',
        voice: '/api/voice'
    },
    
    // Get full API URL
    getApiUrl: function(endpoint) {
        if (endpoint.startsWith('/')) {
            return this.BASE_URL + endpoint;
        }
        return this.BASE_URL + (this.ENDPOINTS[endpoint] || `/${endpoint}`);
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;

// Enhanced debug logging
console.log('🔧 Environment:', window.location.hostname);
console.log('📍 Backend URL:', API_CONFIG.BASE_URL);
console.log('🌐 Frontend URL:', window.location.href);
console.log('📂 Current Path:', window.location.pathname);

// Test backend connectivity with better error handling
setTimeout(() => {
    fetch(API_CONFIG.BASE_URL + '/api/health')
        .then(response => {
            if (response.ok) {
                console.log('✅ Backend connection successful');
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('📊 Backend health:', data);
        })
        .catch(error => {
            console.log('❌ Backend connection failed:', error.message);
            console.log('💡 Make sure your backend is running at', API_CONFIG.BASE_URL);
            
            // Only show error on login page, not dashboard
            if (window.location.pathname.includes('login.html')) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed; top: 10px; right: 10px; z-index: 9999;
                    background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;
                    padding: 10px; border-radius: 5px; max-width: 300px;
                    font-family: Arial, sans-serif; font-size: 14px;
                `;
                errorDiv.innerHTML = `
                    <strong>Backend Connection Error</strong><br>
                    Cannot connect to backend server.<br>
                    <small>Make sure the backend is running on port 5000</small>
                    <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px;">&times;</button>
                `;
                document.body.appendChild(errorDiv);
                
                setTimeout(() => errorDiv.remove(), 15000);
            }
        });
}, 1000);