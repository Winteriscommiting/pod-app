class PodcastApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('token');
        this.user = null;
        this.currentPage = this.getCurrentPage();
        
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.loadUserData();
        this.initializePage();
        this.setupNavigation();
        this.setupThemeToggle();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('upload')) return 'upload';
        if (path.includes('documents')) return 'documents';
        if (path.includes('podcasts')) return 'podcasts';
        if (path.includes('voice-clone')) return 'voice-clone';
        if (path.includes('profile')) return 'profile';
        if (path.includes('settings')) return 'settings';
        if (path.includes('login')) return 'login';
        if (path.includes('register')) return 'register';
        return 'home';
    }

    async loadUserData() {
        if (!this.token) return;

        try {
            const response = await this.apiCall('GET', '/user/profile');
            if (response.success) {
                this.user = response.data.user;
                this.updateUserUI();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateUserUI() {
        if (!this.user) return;

        // Update user name and avatar in navigation
        const userNameElements = document.querySelectorAll('.user-name');
        const userAvatarElements = document.querySelectorAll('.user-avatar');

        userNameElements.forEach(el => el.textContent = this.user.name);
        userAvatarElements.forEach(el => {
            if (this.user.avatarUrl) {
                el.src = this.user.avatarUrl;
            }
        });
    }

    // Initialize page-specific functionality
    initializePage() {
        switch (this.currentPage) {
            case 'login':
            case 'register':
                this.setupAuthForms();
                this.checkAuthRedirect();
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'documents':
            case 'upload':
                this.initializeDocumentUpload();
                break;
            case 'podcasts':
                this.initializePodcasts();
                break;
            case 'voice':
                this.initializeVoice();
                break;
            case 'profile':
                this.initializeProfile();
                break;
            case 'settings':
                this.initializeSettings();
                break;
        }
    }

    // ===== API HELPER METHODS =====

    async apiCall(method, endpoint, data = null) {
        const url = `${this.apiBase}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'API call failed');
            }
            
            return result;
        } catch (error) {
            console.error(`API call failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    async uploadFile(endpoint, formData) {
        const url = `${this.apiBase}${endpoint}`;
        const options = {
            method: 'POST',
            headers: {},
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        options.body = formData;

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }
            
            return result;
        } catch (error) {
            console.error(`Upload failed: ${endpoint}`, error);
            throw error;
        }
    }

    // ===== GLOBAL EVENT LISTENERS =====

    setupGlobalEventListeners() {
        // Global click handlers
        document.addEventListener('click', (e) => {
            // Close dropdowns when clicking outside
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }

            // Handle logout
            if (e.target.matches('.logout-btn, .logout-btn *')) {
                e.preventDefault();
                this.logout();
            }

            // Handle navigation
            if (e.target.matches('[data-navigate]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-navigate');
                this.navigate(page);
            }
        });

        // Global form submission handler for AJAX forms
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.ajax-form')) {
                e.preventDefault();
                this.handleAjaxForm(e.target);
            }
        });

        // File input change handlers
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="file"]')) {
                this.handleFileInputChange(e.target);
            }
        });
    }

    setupNavigation() {
        // Highlight current page in navigation
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
                const isLight = document.body.classList.contains('light-theme');
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            });
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    }

    // ===== NAVIGATION =====

    navigate(page) {
        window.location.href = `/${page}.html`;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    // ===== FORM HANDLERS =====

    async handleAjaxForm(form) {
        const formData = new FormData(form);
        const method = form.getAttribute('method') || 'POST';
        const endpoint = form.getAttribute('action');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            let result;
            if (form.enctype === 'multipart/form-data') {
                result = await this.uploadFile(endpoint, formData);
            } else {
                const data = Object.fromEntries(formData);
                result = await this.apiCall(method, endpoint, data);
            }

            this.showToast(result.message || 'Success!', 'success');
            
            // Trigger custom success event
            form.dispatchEvent(new CustomEvent('ajaxSuccess', { detail: result }));
            
        } catch (error) {
            this.showToast(error.message || 'An error occurred', 'error');
            
            // Trigger custom error event
            form.dispatchEvent(new CustomEvent('ajaxError', { detail: error }));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    handleFileInputChange(input) {
        const file = input.files[0];
        if (!file) return;

        // Update file info display
        const fileInfo = input.closest('.file-upload-area')?.querySelector('.file-info');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-details">
                    <i class="fas fa-file"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
            `;
        }

        // Preview images
        if (file.type.startsWith('image/')) {
            const preview = input.closest('.file-upload-area')?.querySelector('.file-preview');
            if (preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // ===== UTILITY METHODS =====

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showLoading(target = null) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;

        if (target) {
            target.style.position = 'relative';
            target.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        return overlay;
    }

    hideLoading(overlay) {
        if (overlay && overlay.parentElement) {
            overlay.remove();
        }
    }

    // ===== HOME PAGE =====

    initHome() {
        // Mobile menu toggle
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }

        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Check authentication status
        if (this.token) {
            const ctaButtons = document.querySelectorAll('.btn[href="login.html"]');
            ctaButtons.forEach(button => {
                if (button.textContent.includes('Get Started') || button.textContent.includes('Start Creating')) {
                    button.href = 'dashboard.html';
                    button.innerHTML = '<i class="fas fa-tachometer-alt"></i> Go to Dashboard';
                }
            });
        }

        // Animate feature cards on scroll
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const featureCards = document.querySelectorAll('.feature-card');
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Array.from(featureCards).indexOf(entry.target) * 0.1}s`;
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        featureCards.forEach(card => observer.observe(card));
    }

    // ===== PAGE-SPECIFIC INITIALIZERS =====

    initDashboard() {
        this.loadDashboardData();
        this.setupDashboardRefresh();
    }

    initUpload() {
        this.setupFileUpload();
        this.setupDragAndDrop();
    }

    initDocuments() {
        this.loadDocuments();
        this.setupDocumentFilters();
        this.setupDocumentSearch();
    }

    initPodcasts() {
        this.loadPodcasts();
        this.setupAudioPlayers();
        this.setupPodcastFilters();
    }

    initVoiceClone() {
        this.loadVoiceSamples();
        this.loadAvailableVoices();
        this.setupVoiceUpload();
    }

    initProfile() {
        this.loadProfileData();
        this.setupProfileForms();
        this.setupAvatarUpload();
    }

    initSettings() {
        this.loadSettings();
        this.setupSettingsForms();
    }

    initAuth() {
        this.setupAuthForms();
        this.checkAuthRedirect();
    }

    // ===== PLACEHOLDER METHODS (to be implemented) =====

    async loadDashboardData() { 
        if (!this.token) return;
        
        try {
            const response = await this.apiCall('GET', '/user/dashboard');
            if (response.success) {
                this.updateDashboardStats(response.data.stats);
                this.updateRecentActivity(response.data.recent);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboardStats(stats) {
        document.querySelector('[data-stat="documents"]').textContent = stats.documents || 0;
        document.querySelector('[data-stat="podcasts"]').textContent = stats.podcasts || 0;
        document.querySelector('[data-stat="completed"]').textContent = stats.completed || 0;
        document.querySelector('[data-stat="storage"]').textContent = this.formatFileSize(stats.storage || 0);
    }

    updateRecentActivity(recent) {
        const recentContainer = document.querySelector('.recent-activity-list');
        if (!recentContainer) return;

        const items = [...recent.documents, ...recent.podcasts]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        recentContainer.innerHTML = items.map(item => `
            <div class="activity-item">
                <i class="fas fa-${item.fileType ? 'file' : 'podcast'}"></i>
                <div class="activity-details">
                    <span class="activity-name">${item.originalName || item.title}</span>
                    <span class="activity-time">${this.formatDate(item.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    setupDashboardRefresh() {
        const refreshBtn = document.querySelector('.refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
                this.showToast('Dashboard refreshed', 'success');
            });
        }
    }

    // Additional method implementations will be added as needed...
    setupFileUpload() { console.log('Setting up file upload...'); }
    setupDragAndDrop() { console.log('Setting up drag and drop...'); }
    async loadDocuments() { console.log('Loading documents...'); }
    setupDocumentFilters() { console.log('Setting up document filters...'); }
    setupDocumentSearch() { console.log('Setting up document search...'); }
    async loadPodcasts() { console.log('Loading podcasts...'); }
    setupAudioPlayers() { console.log('Setting up audio players...'); }
    setupPodcastFilters() { console.log('Setting up podcast filters...'); }
    async loadVoiceSamples() { console.log('Loading voice samples...'); }
    async loadAvailableVoices() { console.log('Loading available voices...'); }
    setupVoiceUpload() { console.log('Setting up voice upload...'); }
    async loadProfileData() { console.log('Loading profile data...'); }
    setupProfileForms() { console.log('Setting up profile forms...'); }
    setupAvatarUpload() { console.log('Setting up avatar upload...'); }
    async loadSettings() { console.log('Loading settings...'); }
    setupSettingsForms() { console.log('Setting up settings forms...'); }
    setupAuthForms() { console.log('Setting up auth forms...'); }
    checkAuthRedirect() { 
        if (this.token && (this.currentPage === 'login' || this.currentPage === 'register')) {
            window.location.href = '/dashboard.html';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PodcastApp();
});

// Global utility functions
window.formatFileSize = (bytes) => window.app?.formatFileSize(bytes) || '0 Bytes';
window.formatDuration = (seconds) => window.app?.formatDuration(seconds) || '0:00';
window.formatDate = (dateString) => window.app?.formatDate(dateString) || 'Unknown';
window.showToast = (message, type) => window.app?.showToast(message, type);
window.showToast = (message, type) => window.app?.showToast(message, type);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Add animation to step cards
    const stepCards = document.querySelectorAll('.step');
    stepCards.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(20px)';
        step.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        observer.observe(step);
    });

    // Hero card animation
    const heroCard = document.querySelector('.hero-card');
    if (heroCard) {
        heroCard.style.opacity = '0';
        heroCard.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroCard.style.opacity = '1';
            heroCard.style.transform = 'translateY(0)';
        }, 300);
    }

    // Add scroll effect to navbar
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }

    // Demo video placeholder functionality
    const demoBtns = document.querySelectorAll('.btn[href="#how-it-works"]');
    demoBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Smooth scroll to how it works section
            document.getElementById('how-it-works').scrollIntoView({
                behavior: 'smooth'
            });
            
            // Show demo placeholder
            utils.showToast('Demo coming soon! For now, check out the step-by-step process below.', 'info');
        });
    });

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.innerHTML;
        const words = originalText.split(' ');
        heroTitle.innerHTML = '';
        
        words.forEach((word, index) => {
            setTimeout(() => {
                heroTitle.innerHTML += (index > 0 ? ' ' : '') + word;
            }, index * 200);
        });
    }

    // Add counter animation for statistics (if added later)
    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 50);
    }

    // Add contact form functionality (if contact section is added)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Simulate form submission
                await new Promise((resolve) => setTimeout(resolve, 1000));
                utils.showToast('Form submitted successfully!', 'success');
            } catch (error) {
                utils.showToast('Failed to submit form', 'error');
            }
        });
    }
