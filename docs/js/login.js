// Direct login handler
console.log('🔐 Login handler loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 DOM loaded, setting up login form...');
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('❌ Login form not found!');
        return;
    }
    
    console.log('✅ Login form found, adding event listener');
    
    // Prevent form submission multiple ways
    loginForm.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚀 Login form submitted - preventing default');
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        console.log('📧 Email:', email);
        console.log('🔒 Password length:', password ? password.length : 0);
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return false;
        }
        
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        
        // Show loading
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        loginBtn.disabled = true;
        
        try {
            console.log('🌐 Making API call to:', window.API_BASE_URL + '/auth/login');
            
            const response = await fetch(window.API_BASE_URL + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log('📡 Response status:', response.status);
            
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            if (data.success) {
                // Store token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Login successful! Redirecting to dashboard...');
                
                // Redirect
                window.location.href = '/pod-app/dashboard.html';
            } else {
                alert('Login failed: ' + (data.message || 'Unknown error'));
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            alert('Network error: ' + error.message);
        } finally {
            // Reset loading
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            loginBtn.disabled = false;
        }
        
        return false;
    });
    
    // Also handle button click directly
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Login button clicked - triggering form submit');
            loginForm.dispatchEvent(new Event('submit'));
        });
    }
    
    console.log('✅ Login form handler attached');
});
