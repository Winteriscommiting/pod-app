// Direct login handler - VERSION 20250907-2
console.log('🔐 Login handler loaded - CACHE BUSTED VERSION 2');

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
            
            if (response.ok && data.success) {
                // Store token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Login successful! Redirecting to dashboard...');
                
                // Redirect
                window.location.href = '/pod-app/dashboard.html';
            } else {
                // Handle both client and server errors
                const errorMessage = data.message || `Login failed (Status: ${response.status})`;
                alert('Login failed: ' + errorMessage);
                console.error('Login failed:', data);
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
    
    // Handle registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('✅ Register form found, adding event listener');
        
        registerForm.onsubmit = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🚀 Register form submitted - preventing default');
            
            const formData = new FormData(registerForm);
            const username = formData.get('username');
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            console.log('👤 Username:', username);
            console.log('📧 Email:', email);
            console.log('🔒 Password length:', password ? password.length : 0);
            
            if (!username || !email || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return false;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return false;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return false;
            }
            
            const registerBtn = document.getElementById('registerBtn');
            const btnText = registerBtn.querySelector('.btn-text');
            const btnLoader = registerBtn.querySelector('.btn-loader');
            
            // Show loading
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            registerBtn.disabled = true;
            
            try {
                console.log('🌐 Making registration API call to:', window.API_BASE_URL + '/auth/register');
                
                const response = await fetch(window.API_BASE_URL + '/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password })
                });
                
                console.log('📡 Response status:', response.status);
                
                const data = await response.json();
                console.log('📦 Response data:', data);
                
                if (response.ok && data.success) {
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    alert('Registration successful! Redirecting to dashboard...');
                    
                    // Redirect
                    window.location.href = '/pod-app/dashboard.html';
                } else {
                    // Handle both client and server errors
                    const errorMessage = data.message || `Registration failed (Status: ${response.status})`;
                    alert('Registration failed: ' + errorMessage);
                    console.error('Registration failed:', data);
                }
                
            } catch (error) {
                console.error('❌ Registration error:', error);
                alert('Network error: ' + error.message);
            } finally {
                // Reset loading
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';
                registerBtn.disabled = false;
            }
            
            return false;
        });
    }
    
    // Handle form switching
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    
    if (showRegisterBtn && registerCard && loginCard) {
        showRegisterBtn.addEventListener('click', function() {
            console.log('🔄 Switching to registration form');
            loginCard.style.display = 'none';
            registerCard.style.display = 'block';
        });
    }
    
    if (showLoginBtn && registerCard && loginCard) {
        showLoginBtn.addEventListener('click', function() {
            console.log('🔄 Switching to login form');
            registerCard.style.display = 'none';
            loginCard.style.display = 'block';
        });
    }
});
