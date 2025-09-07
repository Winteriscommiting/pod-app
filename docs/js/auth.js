// Authentication Manager
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        if (this.token) {
            try {
                this.user = JSON.parse(localStorage.getItem('user'));
            } catch (e) {
                this.clearAuth();
            }
        }
    }

    async handleLogin(email, password) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('✅ Login successful');
                return { success: true, user: data.user };
            } else {
                console.error('❌ Login failed:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: 'Network error - please try again' };
        }
    }

    async handleRegister(username, email, password) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('✅ Registration successful');
                return { success: true, user: data.user };
            } else {
                console.error('❌ Registration failed:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, message: 'Network error - please try again' };
        }
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    logout() {
        this.clearAuth();
        window.location.href = '/pod-app/';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }
}

// Initialize auth manager
const auth = new AuthManager();

// Make it globally available
window.auth = auth;

console.log('🔐 Auth manager loaded');
