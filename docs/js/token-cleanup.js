// Clear any potentially invalid tokens on page load
document.addEventListener('DOMContentLoaded', function() {
    // Clear localStorage if we're on the login page and there's a token
    // This helps prevent redirect loops
    const currentPath = window.location.pathname;
    
    // If URL has ?clearauth parameter, clear all auth data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearauth') === 'true') {
        console.log('🧹 Clearing authentication data...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    if (currentPath.includes('login.html') || currentPath.includes('index.html') || currentPath === '/') {
        const token = localStorage.getItem('token');
        if (token) {
            console.log('🔄 Token found on login page, will redirect via auth.js');
        }
    }
});
