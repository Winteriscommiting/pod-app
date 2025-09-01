// Clear any potentially invalid tokens on page load
document.addEventListener('DOMContentLoaded', function() {
    // Clear localStorage if we're on the login page and there's a token
    // This helps prevent redirect loops
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('index.html') || currentPath === '/') {
        const token = localStorage.getItem('token');
        if (token) {
            console.log('🔄 Checking existing token...');
            // The auth.js will handle token validation
        }
    }
});
