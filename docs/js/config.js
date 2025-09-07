// Production         // Use production backend when Render is working
        if (isGitHubPages) {
            console.log('📡 Using production backend for GitHub Pages');
            return this.PRODUCTION_URL; // Back to Renderiguration for GitHub Pages
const API_CONFIG = {
    // Production backend URL - DEPLOYED TO RENDER
    PRODUCTION_URL: 'https://pod-app-1.onrender.com/api',
    
    // Local development URL
    DEVELOPMENT_URL: 'http://localhost:5000/api',
    
    // Auto-detect environment
    get API_BASE_URL() {
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        // Use production backend when Render is working
        if (isGitHubPages) {
            console.log('� Using production backend for GitHub Pages');
            return this.PRODUCTION_URL; // Back to Render
        } else if (isLocalhost) {
            console.log('🏠 Using localhost backend');
            return this.DEVELOPMENT_URL;
        } else {
            console.log('🌐 Using production backend');
            return this.PRODUCTION_URL;
        }
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
            console.log('💡 Backend might be sleeping (Render free tier) or deployment issue');
            
            // Show user-friendly message for GitHub Pages
            if (window.location.hostname.includes('github.io')) {
                this.showConnectionError();
            }
            return false;
        }
    },
    
    // Show user-friendly error message
    showConnectionError() {
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: #ff6b6b; color: white; padding: 15px; border-radius: 8px; z-index: 9999; max-width: 300px;">
                <strong>🔌 Backend Disconnected</strong><br>
                The server might be starting up. Please wait a moment and try again.
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">×</button>
            </div>
        `;
        document.body.appendChild(errorMessage);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorMessage.parentElement) {
                errorMessage.remove();
            }
        }, 10000);
    }
};

// Global API base URL
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await API_CONFIG.testConnection();
    if (!isConnected && window.location.hostname.includes('github.io')) {
        console.log('⏳ Backend might be sleeping, will retry automatically...');
        
        // Retry connection after 5 seconds for Render free tier
        setTimeout(async () => {
            await API_CONFIG.testConnection();
        }, 5000);
    }
});

console.log('⚙️ Frontend Config Loaded - GITHUB PAGES + ATLAS');
console.log('� API Base URL:', API_BASE_URL);

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
};

// Make API_BASE_URL globally available
window.API_BASE_URL = API_CONFIG.API_BASE_URL;