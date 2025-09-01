// API Configuration for Production
const API_CONFIG = {
    // This will be updated with your Render backend URL
    BASE_URL: 'http://localhost:5000', // Temporary - will update after Render deployment
    
    // API endpoints
    ENDPOINTS: {
        auth: '/api/auth',
        documents: '/api/documents', 
        podcasts: '/api/podcasts',
        summaries: '/api/documents/summaries'
    },
    
    // Get full API URL
    getApiUrl: function(endpoint) {
        return this.BASE_URL + (this.ENDPOINTS[endpoint] || endpoint);
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;

console.log('API Config loaded:', API_CONFIG);