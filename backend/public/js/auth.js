// Authentication Manager
class AuthManager {
    constructor() {
        this.isSubmitting = false;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkAuthentication();
        
        // Initialize forms
        this.initializeLoginForm();
        this.initializeRegisterForm();
        this.initializeFormToggle();
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        const currentPath = window.location.pathname;
        
        // If user is logged in and on login page, redirect to dashboard
        if (token && (currentPath.includes('login.html') || currentPath === '/' || currentPath.includes('index.html'))) {
            window.location.replace('/dashboard.html');
            return;
        }
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Remove existing event listeners to prevent duplicates
            loginForm.removeEventListener('submit', this.handleLogin.bind(this));
            
            // Add new event listener
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    initializeRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            // Remove existing event listeners to prevent duplicates
            registerForm.removeEventListener('submit', this.handleRegister.bind(this));
            
            // Add new event listener
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    initializeFormToggle() {
        // Toggle between login and register
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');

        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => this.showLoginForm());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        e.stopPropagation();

        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('Login already in progress...');
            return;
        }

        const form = e.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        // Validate inputs
        if (!email || !password) {
            utils.showToast('Please fill in all fields', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        try {
            // Set submitting state
            this.isSubmitting = true;
            submitBtn.disabled = true;
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';

            console.log('Attempting login for:', email);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success) {
                // Store authentication data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                utils.showToast('Login successful! Redirecting...', 'success');

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.replace('/dashboard.html');
                }, 1500);

            } else {
                utils.showToast(data.message || 'Login failed. Please check your credentials.', 'error');
                // Clear password field on error
                form.password.value = '';
            }

        } catch (error) {
            console.error('Login error:', error);
            utils.showToast('Network error. Please check your connection and try again.', 'error');
            // Clear password field on error
            form.password.value = '';
        } finally {
            // Reset submitting state
            this.isSubmitting = false;
            submitBtn.disabled = false;
            
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        e.stopPropagation();

        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('Registration already in progress...');
            return;
        }

        const form = e.target;
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword ? form.confirmPassword.value : password;

        // Validate inputs
        if (!username || !email || !password) {
            utils.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            utils.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            utils.showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        try {
            // Set submitting state
            this.isSubmitting = true;
            submitBtn.disabled = true;
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';

            console.log('Attempting registration for:', email);

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            console.log('Register response:', data);

            if (response.ok && data.success) {
                // Store authentication data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                utils.showToast('Registration successful! Redirecting...', 'success');

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.replace('/dashboard.html');
                }, 1500);

            } else {
                utils.showToast(data.message || 'Registration failed. Please try again.', 'error');
                // Clear password fields on error
                form.password.value = '';
                if (form.confirmPassword) form.confirmPassword.value = '';
            }

        } catch (error) {
            console.error('Registration error:', error);
            utils.showToast('Network error. Please check your connection and try again.', 'error');
            // Clear password fields on error
            form.password.value = '';
            if (form.confirmPassword) form.confirmPassword.value = '';
        } finally {
            // Reset submitting state
            this.isSubmitting = false;
            submitBtn.disabled = false;
            
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }

    showLoginForm() {
        const loginCard = document.getElementById('loginCard');
        const registerCard = document.getElementById('registerCard');
        
        if (loginCard) loginCard.style.display = 'block';
        if (registerCard) registerCard.style.display = 'none';
    }

    showRegisterForm() {
        const loginCard = document.getElementById('loginCard');
        const registerCard = document.getElementById('registerCard');
        
        if (loginCard) loginCard.style.display = 'none';
        if (registerCard) registerCard.style.display = 'block';
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login.html');
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }
}

// Initialize authentication when DOM is loaded
let authManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing authentication...');
    authManager = new AuthManager();
});

// Export for global access
window.authManager = authManager;
window.auth = {
    login: (email, password) => authManager.handleLogin({ preventDefault: () => {}, target: { email: { value: email }, password: { value: password } } }),
    logout: () => authManager.logout(),
    isAuthenticated: () => authManager.isAuthenticated(),
    getToken: () => authManager.getToken(),
    getUser: () => authManager.getUser()
};