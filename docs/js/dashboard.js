// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication with better logging
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Dashboard authentication check:');
    console.log('🔑 Token present:', !!token);
    console.log('👤 User data present:', !!user);
    
    if (!token) {
        console.log('❌ No token found, redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100); // Small delay to ensure storage is checked
        return;
    }

    console.log('✅ Authenticated, initializing dashboard...');
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

let currentTab = 'documents';
let documents = [];
let podcasts = [];
let voices = { ai: [], cloned: [] };

function initializeDashboard() {
    // Display user info
    const user = utils.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.username;
        document.getElementById('settingsUsername').textContent = user.username;
        document.getElementById('settingsEmail').textContent = user.email;
    }
    
    // Initialize summarization manager if available
    if (typeof SummarizationManager !== 'undefined') {
        window.summarizationManager = new SummarizationManager();
    }
    
    // Set up tab navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', utils.logout);
    
    // Upload document buttons
    document.getElementById('uploadDocBtn').addEventListener('click', () => utils.showModal('uploadModal'));
    document.getElementById('uploadDocBtnEmpty').addEventListener('click', () => utils.showModal('uploadModal'));
    
    // Create podcast buttons
    document.getElementById('createPodcastBtn').addEventListener('click', () => openCreatePodcastModal());
    document.getElementById('createPodcastBtnEmpty').addEventListener('click', () => openCreatePodcastModal());
    
    // Upload voice button
    document.getElementById('uploadVoiceBtn').addEventListener('click', () => utils.showModal('voiceModal'));
    
    // Modal close buttons
    document.getElementById('closeUploadModal').addEventListener('click', () => utils.hideModal('uploadModal'));
    document.getElementById('closePodcastModal').addEventListener('click', () => utils.hideModal('podcastModal'));
    document.getElementById('closeVoiceModal').addEventListener('click', () => utils.hideModal('voiceModal'));
    document.getElementById('closeAudioPlayer').addEventListener('click', () => utils.hideModal('audioPlayerModal'));
    
    // Form submissions
    document.getElementById('uploadForm').addEventListener('submit', handleDocumentUpload);
    document.getElementById('podcastForm').addEventListener('submit', handlePodcastCreation);
    document.getElementById('voiceForm').addEventListener('submit', handleVoiceUpload);
    
    // Voice type change
    document.getElementById('voiceType').addEventListener('change', handleVoiceTypeChange);
    
    // Test voice button
    document.getElementById('testVoiceBtn').addEventListener('click', handleVoiceTest);
    
    // File input changes
    document.getElementById('documentFile').addEventListener('change', handleFileInputChange);
    document.getElementById('voiceFile').addEventListener('change', handleFileInputChange);
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load tab-specific data
    switch (tabName) {
        case 'documents':
            loadDocuments();
            break;
        case 'podcasts':
            loadPodcasts();
            break;
        case 'summaries':
            if (window.summarizationManager) {
                window.summarizationManager.loadSummaries();
            }
            break;
        case 'voices':
            loadVoices();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadDocuments(),
            loadPodcasts(),
            loadVoices()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        utils.showToast('Error loading dashboard data', 'error');
    }
}

async function loadDocuments() {
    try {
        const response = await utils.apiRequest('/documents');
        documents = response.documents || [];
        renderDocuments();
    } catch (error) {
        console.error('Error loading documents:', error);
        utils.showToast('Error loading documents', 'error');
    }
}

// Make loadDocuments available globally
window.loadDocuments = loadDocuments;

function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    
    if (documents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-upload"></i>
                <h3>No documents yet</h3>
                <p>Upload your first document to get started</p>
                <button class="btn btn-primary" onclick="utils.showModal('uploadModal')">
                    <i class="fas fa-upload"></i>
                    Upload Document
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = documents.map(doc => `
        <div class="document-card">
            <div class="card-header">
                <i class="${utils.getFileTypeIcon(doc.fileType)} card-icon"></i>
                <h3 class="card-title">${utils.truncateText(doc.originalName, 30)}</h3>
            </div>
            <div class="card-meta">
                <span>${utils.formatFileSize(doc.fileSize)}</span>
                <span class="status-badge status-${doc.processingStatus}">
                    ${doc.processingStatus}
                </span>
            </div>
            <div class="card-meta">
                <span>${doc.wordCount || 0} words</span>
                <span>${utils.formatDate(doc.createdAt)}</span>
            </div>
            <div class="card-actions">
                ${doc.processingStatus === 'completed' ? `
                    <button class="btn btn-small btn-primary" onclick="createPodcastFromDocument('${doc._id}')">
                        <i class="fas fa-headphones"></i>
                        Create Podcast
                    </button>
                ` : ''}
                <button class="btn btn-small btn-secondary" onclick="viewDocument('${doc._id}')">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button class="btn btn-small" onclick="deleteDocument('${doc._id}')" style="color: #ef4444;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function loadPodcasts() {
    try {
        const response = await utils.apiRequest('/podcasts');
        podcasts = response.data || [];
        console.log('Loaded podcasts:', podcasts.length);
        renderPodcasts();
    } catch (error) {
        console.error('Error loading podcasts:', error);
        utils.showToast('Error loading podcasts', 'error');
    }
}

function renderPodcasts() {
    const grid = document.getElementById('podcastsGrid');
    
    if (podcasts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-headphones"></i>
                <h3>No podcasts yet</h3>
                <p>Create your first podcast from a document</p>
                <button class="btn btn-primary" onclick="openCreatePodcastModal()">
                    <i class="fas fa-plus"></i>
                    Create Podcast
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = podcasts.map(podcast => `
        <div class="podcast-card">
            <div class="card-header">
                <i class="fas fa-headphones card-icon"></i>
                <h3 class="card-title">${utils.truncateText(podcast.title, 30)}</h3>
                ${podcast.contentType === 'summary' ? '<span class="content-badge">From Summary</span>' : ''}
            </div>
            <div class="card-meta">
                <span>${podcast.documentId?.originalName || 'Document'}</span>
                <span class="status-badge status-${podcast.status || podcast.generationStatus}">
                    ${getStatusDisplay(podcast.status || podcast.generationStatus)}
                </span>
            </div>
            <div class="card-meta">
                <span>${podcast.wordCount || podcast.metadata?.wordCount || 0} words</span>
                <span>${utils.formatDate(podcast.createdAt)}</span>
            </div>
            ${podcast.progress !== undefined ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${podcast.progress}%"></div>
                    <span class="progress-text">${podcast.progress}%</span>
                </div>
            ` : ''}
            ${podcast.estimatedDuration ? `
                <div class="card-meta">
                    <span>Est. Duration: ${utils.formatDuration(podcast.estimatedDuration)}</span>
                    ${podcast.actualDuration ? `<span>Actual: ${utils.formatDuration(podcast.actualDuration)}</span>` : ''}
                </div>
            ` : ''}
            <div class="card-actions">
                ${(podcast.status === 'completed' || podcast.generationStatus === 'completed') && (podcast.audioUrl || podcast.audioFile) ? `
                    <button class="btn btn-small btn-primary" onclick="playPodcast('${podcast._id}')">
                        <i class="fas fa-play"></i>
                        Play
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="downloadPodcast('${podcast._id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                ` : podcast.status === 'ready_for_browser' ? `
                    <button class="btn btn-small btn-primary" onclick="playBrowserTTS('${podcast._id}')">
                        <i class="fas fa-volume-up"></i>
                        Play TTS
                    </button>
                ` : ''}
                ${podcast.status === 'generating' ? `
                    <button class="btn btn-small btn-secondary" onclick="checkPodcastProgress('${podcast._id}')">
                        <i class="fas fa-sync fa-spin"></i>
                        Generating...
                    </button>
                ` : ''}
                <button class="btn btn-small" onclick="deletePodcast('${podcast._id}')" style="color: #ef4444;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            ${podcast.errorMessage ? `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${podcast.errorMessage}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusDisplay(status) {
    const statusMap = {
        'pending': 'Pending',
        'generating': 'Generating',
        'completed': 'Completed',
        'failed': 'Failed',
        'ready_for_browser': 'Ready to Play'
    };
    return statusMap[status] || status;
}

async function loadVoices() {
    try {
        const response = await utils.apiRequest('/voice/available');
        voices = response.voices || { ai: [], cloned: [] };
        renderVoices();
    } catch (error) {
        console.error('Error loading voices:', error);
        utils.showToast('Error loading voices', 'error');
    }
}

function renderVoices() {
    const aiGrid = document.getElementById('aiVoicesGrid');
    const clonedGrid = document.getElementById('clonedVoicesGrid');
    
    // Render AI voices
    aiGrid.innerHTML = voices.ai.map(voice => `
        <div class="voice-card">
            <div class="card-header">
                <i class="fas fa-robot card-icon"></i>
                <h3 class="card-title">${voice.name}</h3>
            </div>
            <div class="card-meta">
                <span>${voice.language.toUpperCase()}</span>
                <span>${voice.region?.toUpperCase() || ''}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-small btn-primary" onclick="testVoicePreview('${voice.id}', 'ai')">
                    <i class="fas fa-play"></i>
                    Test
                </button>
            </div>
        </div>
    `).join('');
    
    // Render cloned voices
    if (voices.cloned.length === 0) {
        clonedGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microphone-alt"></i>
                <h4>No voice samples yet</h4>
                <p>Upload a voice sample to create your cloned voice</p>
            </div>
        `;
    } else {
        clonedGrid.innerHTML = voices.cloned.map(voice => `
            <div class="voice-card">
                <div class="card-header">
                    <i class="fas fa-user card-icon"></i>
                    <h3 class="card-title">${voice.name}</h3>
                </div>
                <div class="card-meta">
                    <span>Cloned Voice</span>
                    <span>${utils.formatDuration(voice.duration || 0)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-small btn-primary" onclick="testVoicePreview('${voice.id}', 'cloned')">
                        <i class="fas fa-play"></i>
                        Test
                    </button>
                    <button class="btn btn-small" onclick="deleteVoiceSample('${voice.id}')" style="color: #ef4444;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function loadSettings() {
    const user = utils.getCurrentUser();
    if (user && user.preferences) {
        document.getElementById('audioQuality').value = user.preferences.audioQuality || 'medium';
    }
}

// Event Handlers
async function handleDocumentUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const file = formData.get('document');
    
    if (!file) {
        utils.showToast('Please select a file', 'error');
        return;
    }
    
    // Validate file
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    if (!utils.validateFileType(file, allowedTypes)) {
        utils.showToast('Invalid file type. Only PDF, DOCX, and TXT files are allowed.', 'error');
        return;
    }
    
    if (!utils.validateFileSize(file, 10)) {
        utils.showToast('File size too large. Maximum 10MB allowed.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.setButtonLoading(submitBtn, true);
    
    try {
        const response = await utils.apiRequest('/documents/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.success) {
            utils.showToast('Document uploaded successfully!', 'success');
            utils.hideModal('uploadModal');
            e.target.reset();
            await loadDocuments();
            
            // Trigger summarization if manager is available
            if (window.summarizationManager && response.data && response.data.id) {
                try {
                    await window.summarizationManager.startSummarization(response.data.id);
                    utils.showToast('Document summarization started', 'info');
                } catch (error) {
                    console.error('Summarization error:', error);
                    // Don't show error toast since document upload was successful
                }
            }
        }
    } catch (error) {
        console.error('Upload error:', error);
        utils.showToast(error.message || 'Upload failed', 'error');
    } finally {
        utils.setButtonLoading(submitBtn, false);
    }
}

async function openCreatePodcastModal() {
    // Load available documents
    const documentsSelect = document.getElementById('podcastDocument');
    const completedDocs = documents.filter(doc => doc.processingStatus === 'completed');
    
    documentsSelect.innerHTML = '<option value="">Choose a document...</option>' +
        completedDocs.map(doc => 
            `<option value="${doc._id}">${doc.originalName}</option>`
        ).join('');
    
    if (completedDocs.length === 0) {
        utils.showToast('No completed documents available. Please upload and process a document first.', 'error');
        return;
    }
    
    utils.showModal('podcastModal');
}

function handleVoiceTypeChange(e) {
    const voiceType = e.target.value;
    const voiceSelection = document.getElementById('voiceSelection');
    
    if (voiceType === 'ai') {
        voiceSelection.innerHTML = '<option value="">Choose an AI voice...</option>' +
            voices.ai.map(voice => 
                `<option value="${voice.id}">${voice.name}</option>`
            ).join('');
    } else if (voiceType === 'cloned') {
        voiceSelection.innerHTML = '<option value="">Choose a cloned voice...</option>' +
            voices.cloned.map(voice => 
                `<option value="${voice.id}">${voice.name}</option>`
            ).join('');
    } else {
        voiceSelection.innerHTML = '<option value="">Choose a voice...</option>';
    }
}

async function handlePodcastCreation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const podcastData = {
        documentId: formData.get('documentId'),
        title: formData.get('title'),
        description: formData.get('description'),
        voiceType: formData.get('voiceType'),
        voiceId: formData.get('voiceId')
    };
    
    // Validate
    if (!podcastData.documentId || !podcastData.title || !podcastData.voiceType || !podcastData.voiceId) {
        utils.showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.setButtonLoading(submitBtn, true);
    
    try {
        const response = await utils.apiRequest('/podcasts', {
            method: 'POST',
            body: JSON.stringify(podcastData)
        });
        
        if (response.success) {
            utils.showToast('Podcast generation started! This may take a few minutes.', 'success');
            utils.hideModal('podcastModal');
            e.target.reset();
            await loadPodcasts();
        }
    } catch (error) {
        console.error('Podcast creation error:', error);
        utils.showToast(error.message || 'Failed to create podcast', 'error');
    } finally {
        utils.setButtonLoading(submitBtn, false);
    }
}

async function handleVoiceUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const file = formData.get('voiceSample');
    
    if (!file) {
        utils.showToast('Please select a voice sample', 'error');
        return;
    }
    
    // Validate file
    const allowedTypes = ['.wav', '.mp3', '.m4a', '.flac'];
    if (!utils.validateFileType(file, allowedTypes)) {
        utils.showToast('Invalid file type. Only WAV, MP3, M4A, and FLAC files are allowed.', 'error');
        return;
    }
    
    if (!utils.validateFileSize(file, 50)) {
        utils.showToast('File size too large. Maximum 50MB allowed.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.setButtonLoading(submitBtn, true);
    
    try {
        const response = await utils.apiRequest('/voice/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.success) {
            utils.showToast('Voice sample uploaded successfully!', 'success');
            utils.hideModal('voiceModal');
            e.target.reset();
            await loadVoices();
        }
    } catch (error) {
        console.error('Voice upload error:', error);
        utils.showToast(error.message || 'Upload failed', 'error');
    } finally {
        utils.setButtonLoading(submitBtn, false);
    }
}

function handleFileInputChange(e) {
    const file = e.target.files[0];
    const uploadArea = e.target.nextElementSibling;
    
    if (file) {
        uploadArea.innerHTML = `
            <i class="fas fa-file"></i>
            <p>${file.name}</p>
            <span>${utils.formatFileSize(file.size)}</span>
        `;
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = '#f8fafc';
    }
}

async function handleVoiceTest() {
    const voiceType = document.getElementById('voiceType').value;
    const voiceId = document.getElementById('voiceSelection').value;
    
    if (!voiceType || !voiceId) {
        utils.showToast('Please select a voice type and voice', 'error');
        return;
    }
    
    const testBtn = document.getElementById('testVoiceBtn');
    utils.setButtonLoading(testBtn, true);
    
    try {
        const response = await utils.apiRequest('/voice/test', {
            method: 'POST',
            body: JSON.stringify({
                voiceType,
                voiceId,
                text: 'Hello! This is a test of your selected voice. How does it sound?'
            })
        });
        
        if (response.success) {
            // Play the test audio
            playAudio(`/api/voice/test/${response.audio.filename}`, 'Voice Test');
        }
    } catch (error) {
        console.error('Voice test error:', error);
        utils.showToast(error.message || 'Voice test failed', 'error');
    } finally {
        utils.setButtonLoading(testBtn, false);
    }
}

// Modal functionality
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    const modalTriggers = {
        'uploadDocBtn': 'uploadModal',
        'uploadDocBtnEmpty': 'uploadModal',
        'createPodcastBtn': 'podcastModal',
        'createPodcastBtnEmpty': 'podcastModal',
        'uploadVoiceBtn': 'voiceModal'
    };

    // Modal open functionality
    Object.entries(modalTriggers).forEach(([triggerId, modalId]) => {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        
        if (trigger && modal) {
            trigger.addEventListener('click', () => {
                openModal(modalId);
            });
        }
    });

    // Modal close functionality
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input in modal
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            resetFormErrors(form);
        }
    }
}

function resetFormErrors(form) {
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.remove());
    
    const inputs = form.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
}

// Utility functions for dashboard operations
async function createPodcastFromDocument(documentId) {
    const doc = documents.find(d => d._id === documentId);
    if (!doc) return;
    
    // Pre-fill the form
    document.getElementById('podcastDocument').value = documentId;
    document.getElementById('podcastTitle').value = `Podcast from ${doc.originalName}`;
    
    openCreatePodcastModal();
}

async function viewDocument(documentId) {
    try {
        const response = await utils.apiRequest(`/documents/${documentId}`);
        const doc = response.document;
        
        // Show document details in a modal or navigate to a detailed view
        utils.showToast(`Document: ${doc.originalName}\nWords: ${doc.wordCount}\nStatus: ${doc.processingStatus}`, 'info');
    } catch (error) {
        console.error('Error viewing document:', error);
        utils.showToast('Error loading document details', 'error');
    }
}

async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }
    
    try {
        await utils.apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
        utils.showToast('Document deleted successfully', 'success');
        await loadDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        utils.showToast('Error deleting document', 'error');
    }
}

async function playPodcast(podcastId) {
    const podcast = podcasts.find(p => p._id === podcastId);
    if (!podcast) return;
    
    // Handle different audio sources based on our new schema
    if ((podcast.status === 'completed' || podcast.generationStatus === 'completed') && 
        (podcast.audioUrl || podcast.audioFile)) {
        // Play from file/URL
        const audioUrl = podcast.audioUrl || `/api/podcasts/${podcastId}/stream`;
        playAudio(audioUrl, podcast.title);
    } else if (podcast.status === 'ready_for_browser') {
        // Use browser TTS
        playBrowserTTS(podcastId);
    }
}

function playBrowserTTS(podcastId) {
    console.log('playBrowserTTS called with podcastId:', podcastId);
    const podcast = podcasts.find(p => p._id === podcastId);
    console.log('Found podcast:', podcast);
    
    if (!podcast) {
        console.error('Podcast not found');
        return;
    }
    
    // Stop any current speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // Get content from different possible sources
    let content = podcast.formattedContent || podcast.content;
    console.log('Direct content:', !!content);
    
    // If no direct content, try to parse audioInstructions
    if (!content && podcast.audioInstructions) {
        console.log('Trying audioInstructions:', podcast.audioInstructions);
        try {
            const instructions = typeof podcast.audioInstructions === 'string' 
                ? JSON.parse(podcast.audioInstructions) 
                : podcast.audioInstructions;
            content = instructions.text;
            console.log('Extracted content from audioInstructions:', !!content);
        } catch (e) {
            console.error('Error parsing audioInstructions:', e);
        }
    }
    
    if (!content) {
        console.error('No content available');
        utils.showToast('No content available for playback', 'error');
        return;
    }
    
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 100));
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(content);
    
    // Apply voice settings if available
    if (podcast.voiceSettings) {
        if (podcast.voiceSettings.rate) utterance.rate = podcast.voiceSettings.rate;
        if (podcast.voiceSettings.pitch) utterance.pitch = podcast.voiceSettings.pitch;
        if (podcast.voiceSettings.volume) utterance.volume = podcast.voiceSettings.volume;
        
        // Find and set voice if specified
        if (podcast.voiceSettings.voice) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => 
                voice.name === podcast.voiceSettings.voice || 
                voice.lang.includes(podcast.voiceSettings.voice)
            );
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
    }
    
    // Set up event handlers
    utterance.onstart = () => {
        utils.showToast('Podcast playback started', 'success');
    };
    
    utterance.onend = () => {
        utils.showToast('Podcast playback completed', 'success');
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        utils.showToast('Error during playback', 'error');
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
}

function checkPodcastProgress(podcastId) {
    fetch(`/api/podcasts/${podcastId}/progress`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the podcast in our local array
                const podcastIndex = podcasts.findIndex(p => p._id === podcastId);
                if (podcastIndex !== -1) {
                    podcasts[podcastIndex] = { ...podcasts[podcastIndex], ...data.podcast };
                    renderPodcasts();
                }
                
                // If still generating, check again in a few seconds
                if (data.podcast.status === 'generating') {
                    setTimeout(() => checkPodcastProgress(podcastId), 3000);
                }
            }
        })
        .catch(error => {
            console.error('Error checking progress:', error);
        });
}

async function downloadPodcast(podcastId) {
    try {
        const podcast = podcasts.find(p => p._id === podcastId);
        if (!podcast) return;
        
        // Check if we have an audio file to download
        if ((podcast.status === 'completed' || podcast.generationStatus === 'completed') && 
            (podcast.audioUrl || podcast.audioFile)) {
            const link = document.createElement('a');
            link.href = podcast.audioUrl || `/api/podcasts/${podcastId}/download`;
            link.download = `${podcast.title}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            utils.showToast('No audio file available for download', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        utils.showToast('Error downloading podcast', 'error');
    }
}

async function deletePodcast(podcastId) {
    if (!confirm('Are you sure you want to delete this podcast? This action cannot be undone.')) {
        return;
    }
    
    try {
        await utils.apiRequest(`/podcasts/${podcastId}`, { method: 'DELETE' });
        utils.showToast('Podcast deleted successfully', 'success');
        await loadPodcasts();
    } catch (error) {
        console.error('Error deleting podcast:', error);
        utils.showToast('Error deleting podcast', 'error');
    }
}

async function testVoicePreview(voiceId, voiceType) {
    try {
        const response = await utils.apiRequest('/voice/test', {
            method: 'POST',
            body: JSON.stringify({
                voiceType,
                voiceId,
                text: 'Hello! This is a preview of this voice. How does it sound to you?'
            })
        });
        
        if (response.success) {
            playAudio(`/api/voice/test/${response.audio.filename}`, 'Voice Preview');
        }
    } catch (error) {
        console.error('Voice preview error:', error);
        utils.showToast('Error playing voice preview', 'error');
    }
}

async function deleteVoiceSample(sampleId) {
    if (!confirm('Are you sure you want to delete this voice sample? This action cannot be undone.')) {
        return;
    }
    
    try {
        await utils.apiRequest(`/voice/samples/${sampleId}`, { method: 'DELETE' });
        utils.showToast('Voice sample deleted successfully', 'success');
        await loadVoices();
    } catch (error) {
        console.error('Error deleting voice sample:', error);
        utils.showToast('Error deleting voice sample', 'error');
    }
}

function playAudio(audioUrl, title) {
    const audioElement = document.getElementById('audioElement');
    const audioPlayerTitle = document.getElementById('audioPlayerTitle');
    const audioInfo = document.getElementById('audioInfo');
    
    audioPlayerTitle.textContent = title;
    audioElement.src = audioUrl;
    audioInfo.innerHTML = `
        <div style="text-align: center; color: #64748b;">
            <p>Loading audio...</p>
        </div>
    `;
    
    audioElement.addEventListener('loadedmetadata', function() {
        audioInfo.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Duration: ${utils.formatDuration(this.duration)}</span>
                <span>Format: MP3</span>
            </div>
        `;
    }, { once: true });
    
    utils.showModal('audioPlayerModal');
}

// Delete document function
async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await utils.apiRequest(`/api/documents/${documentId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            utils.showToast('Document deleted successfully', 'success');
            
            // Remove from documents array
            documents = documents.filter(doc => doc._id !== documentId);
            
            // Re-render documents
            renderDocuments();
            
            // Refresh summaries if on summaries tab
            if (currentTab === 'summaries' && window.summarizationManager) {
                window.summarizationManager.loadSummaries();
                window.summarizationManager.loadSummarizationStats();
            }
        } else {
            utils.showToast('Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        utils.showToast('Error deleting document', 'error');
    }
}

// Make function available globally
window.deleteDocument = deleteDocument;
