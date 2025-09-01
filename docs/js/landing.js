// Landing Page Interactive Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initFAQ();
    initDemoWorkflow();
    initVoicePreview();
    initSmoothScrolling();
    initAnimations();
});

// FAQ Toggle Functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
}

// Demo Workflow Animation
function initDemoWorkflow() {
    const workflowSteps = document.querySelectorAll('.demo-workflow .workflow-step');
    let currentStep = 0;
    
    function animateWorkflow() {
        // Remove active class from all steps
        workflowSteps.forEach(step => step.classList.remove('active'));
        
        // Add active class to current step
        if (workflowSteps[currentStep]) {
            workflowSteps[currentStep].classList.add('active');
        }
        
        // Move to next step
        currentStep = (currentStep + 1) % workflowSteps.length;
    }
    
    // Start animation
    if (workflowSteps.length > 0) {
        animateWorkflow(); // Initial state
        setInterval(animateWorkflow, 2000); // Change every 2 seconds
    }
}

// Voice Preview Functionality
function initVoicePreview() {
    const voiceTestButtons = document.querySelectorAll('.voice-test-btn');
    const voicePreviewButton = document.querySelector('.voice-preview-btn');
    
    // Test voice buttons
    voiceTestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const voiceName = this.closest('.voice-sample').querySelector('.voice-name').textContent;
            playVoicePreview(`Hello! This is a preview of the ${voiceName} voice. Your documents will sound great with this natural speech synthesis.`);
        });
    });
    
    // Main voice preview button
    if (voicePreviewButton) {
        voicePreviewButton.addEventListener('click', function() {
            playVoicePreview('Welcome to our free podcast creator! Transform your documents into engaging audio content with just a few clicks.');
        });
    }
}

// Voice Preview Player
function playVoicePreview(text) {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Get available voices
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to use a natural-sounding voice
            const preferredVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('natural') ||
                voice.name.toLowerCase().includes('enhanced') ||
                voice.lang.startsWith('en')
            ) || voices[0];
            
            utterance.voice = preferredVoice;
        }
        
        // Add visual feedback
        const activeButton = document.querySelector('.voice-test-btn:focus, .voice-preview-btn:focus');
        if (activeButton) {
            const originalIcon = activeButton.querySelector('i');
            if (originalIcon) {
                originalIcon.className = 'fas fa-stop';
                
                utterance.onend = () => {
                    originalIcon.className = 'fas fa-play';
                };
            }
        }
        
        // Speak the text
        speechSynthesis.speak(utterance);
    } else {
        alert('Sorry, your browser does not support voice preview. Please try the full application to hear the voices!');
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just a hash
            if (href === '#') return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll-triggered Animations
function initAnimations() {
    // Create intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.feature-card, .testimonial-card, .demo-step, .stat-item, .workflow-step'
    );
    
    animatedElements.forEach(el => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        // Add delay for staggered animation
        const delay = Math.random() * 0.3;
        el.style.transitionDelay = `${delay}s`;
        
        observer.observe(el);
    });
}

// Demo Video Placeholder Interaction
document.addEventListener('click', function(e) {
    if (e.target.closest('.video-placeholder')) {
        const placeholder = e.target.closest('.video-placeholder');
        const playButton = placeholder.querySelector('.play-button');
        
        // Add click animation
        playButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            playButton.style.transform = 'scale(1.1)';
        }, 100);
        
        // Show demo message
        setTimeout(() => {
            alert('Demo video would play here! This shows the complete process from document upload to podcast download.');
        }, 200);
    }
});

// Header Scroll Effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'white';
            header.style.backdropFilter = 'none';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    }
});

// Stats Counter Animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (target === Infinity) {
            element.textContent = '∞';
        } else if (target.toString().includes('.')) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Initialize counter animations when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.dataset.animated) {
                statNumber.dataset.animated = 'true';
                const text = statNumber.textContent;
                
                if (text === '∞') {
                    statNumber.textContent = '0';
                    setTimeout(() => {
                        statNumber.textContent = '∞';
                    }, 1000);
                } else {
                    const value = parseFloat(text.replace(/[^0-9.]/g, ''));
                    statNumber.textContent = '0';
                    animateCounter(statNumber, value);
                }
            }
        }
    });
}, { threshold: 0.5 });

// Observe stat items
document.addEventListener('DOMContentLoaded', function() {
    const statItems = document.querySelectorAll('.stat-item, .stat-highlight');
    statItems.forEach(item => statsObserver.observe(item));
});

// Theme Toggle Functionality (if theme toggle exists)
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            
            if (isDark) {
                body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            } else {
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}

// Initialize theme toggle
document.addEventListener('DOMContentLoaded', initThemeToggle);
