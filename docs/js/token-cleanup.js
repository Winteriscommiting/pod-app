// Handle authentication clearing and debugging
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    
    // If URL has ?clearauth parameter, clear all auth data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearauth') === 'true') {
        console.log('🧹 Clearing authentication data...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('Authentication data cleared! You can now test login.');
        return;
    }
    
    // Add debug info
    console.log('📍 Current page:', currentPath);
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    
    // Add a manual auth check button for debugging
    if (currentPath.includes('login.html')) {
        setTimeout(() => {
            const token = localStorage.getItem('token');
            if (token) {
                const debugDiv = document.createElement('div');
                debugDiv.style.cssText = `
                    position: fixed; top: 10px; left: 10px; z-index: 9999;
                    background: #fff3cd; border: 1px solid #ffeaa7; color: #856404;
                    padding: 10px; border-radius: 5px; font-size: 12px;
                `;
                debugDiv.innerHTML = `
                    <strong>Debug:</strong> Token found!<br>
                    <button onclick="localStorage.clear(); location.reload();" style="margin-top: 5px;">Clear & Reload</button>
                    <button onclick="window.location.href='dashboard.html'" style="margin-top: 5px;">Go to Dashboard</button>
                `;
                document.body.appendChild(debugDiv);
            }
        }, 1000);
    }
});
