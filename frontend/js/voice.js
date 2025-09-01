// ===== VOICE CLONING FUNCTIONALITY =====

// Extend PodcastApp with voice-specific functionality
PodcastApp.prototype.initializeVoice = async function() {
    await this.loadVoiceLibrary();
    this.setupVoiceEventListeners();
    this.initializeVoiceUpload();
};

PodcastApp.prototype.setupVoiceEventListeners = function() {
    const uploadForm = document.getElementById('voiceUploadForm');
    const cloneForm = document.getElementById('voiceCloneForm');
    const searchInput = document.getElementById('voiceSearch');
    const categoryFilter = document.getElementById('categoryFilter');

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => this.handleVoiceUpload(e));
    }

    if (cloneForm) {
        cloneForm.addEventListener('submit', (e) => this.handleVoiceCloning(e));
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => this.filterVoices());
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => this.filterVoices());
    }

    // Voice preview functionality
    this.setupVoicePreview();
};

PodcastApp.prototype.initializeVoiceUpload = function() {
    const uploadArea = document.querySelector('.voice-upload-area');
    const fileInput = document.getElementById('voiceFile');

    if (uploadArea && fileInput) {
        // Drag and drop functionality for voice files
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
        });

        uploadArea.addEventListener('drop', (e) => this.handleVoiceDrop(e, fileInput), false);
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleVoiceFileSelect(e));
    }

    // Audio recording functionality
    this.initializeAudioRecording();
};

PodcastApp.prototype.initializeAudioRecording = function() {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const playBtn = document.getElementById('playBtn');
    const audioPreview = document.getElementById('audioPreview');

    if (!recordBtn) return;

    let mediaRecorder;
    let recordedChunks = [];

    recordBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                audioPreview.src = url;
                playBtn.style.display = 'inline-block';
                
                // Convert blob to file for upload
                const file = new File([blob], 'recorded-voice.wav', { type: 'audio/wav' });
                this.setRecordedFile(file);
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            
            this.showToast('Recording started...', 'info');
        } catch (error) {
            this.showToast('Could not access microphone', 'error');
        }
    });

    stopBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            recordedChunks = [];
            this.showToast('Recording stopped', 'success');
        }
    });

    playBtn.addEventListener('click', () => {
        audioPreview.play();
    });
};

PodcastApp.prototype.setRecordedFile = function(file) {
    // Store the recorded file for upload
    this.recordedVoiceFile = file;
    
    // Update UI to show recorded file
    const fileInfo = document.querySelector('.voice-file-info');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="recorded-file">
                <i class="fas fa-microphone"></i>
                <span>Recorded Audio (${this.formatFileSize(file.size)})</span>
            </div>
        `;
        fileInfo.style.display = 'block';
    }
};

PodcastApp.prototype.handleVoiceDrop = function(e, fileInput) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (this.isValidAudioFile(file)) {
            fileInput.files = files;
            this.displayVoiceFile(file);
        } else {
            this.showToast('Please upload a valid audio file (MP3, WAV, M4A)', 'error');
        }
    }
};

PodcastApp.prototype.handleVoiceFileSelect = function(e) {
    const file = e.target.files[0];
    if (file) {
        if (this.isValidAudioFile(file)) {
            this.displayVoiceFile(file);
        } else {
            this.showToast('Please upload a valid audio file (MP3, WAV, M4A)', 'error');
            e.target.value = '';
        }
    }
};

PodcastApp.prototype.isValidAudioFile = function(file) {
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
    return validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a)$/i);
};

PodcastApp.prototype.displayVoiceFile = function(file) {
    const fileInfo = document.querySelector('.voice-file-info');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="uploaded-file">
                <i class="fas fa-file-audio"></i>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
        fileInfo.style.display = 'block';
    }

    // Show audio preview
    const audioPreview = document.getElementById('uploadedAudioPreview');
    if (audioPreview) {
        const url = URL.createObjectURL(file);
        audioPreview.src = url;
        audioPreview.style.display = 'block';
    }
};

PodcastApp.prototype.handleVoiceUpload = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Use recorded file if available, otherwise use uploaded file
    if (this.recordedVoiceFile) {
        formData.set('voiceFile', this.recordedVoiceFile);
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Validation
    if (!formData.get('voiceFile') || formData.get('voiceFile').size === 0) {
        this.showToast('Please upload or record a voice sample', 'error');
        return;
    }

    if (!formData.get('name')) {
        this.showToast('Please enter a name for the voice', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        const response = await this.apiCall('POST', '/voice/upload', formData, true);

        if (response.success) {
            this.showToast('Voice sample uploaded successfully!', 'success');
            form.reset();
            document.querySelector('.voice-file-info').style.display = 'none';
            document.getElementById('uploadedAudioPreview').style.display = 'none';
            this.recordedVoiceFile = null;
            this.loadVoiceLibrary();
        }
    } catch (error) {
        this.showToast(error.message || 'Upload failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

PodcastApp.prototype.handleVoiceCloning = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cloning voice...';

        const response = await this.apiCall('POST', '/voice/clone', data);

        if (response.success) {
            this.showToast('Voice cloning started! This may take a few minutes.', 'success');
            form.reset();
            this.loadVoiceLibrary();
            
            // Monitor cloning progress
            this.monitorVoiceCloning(response.voiceId);
        }
    } catch (error) {
        this.showToast(error.message || 'Voice cloning failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

PodcastApp.prototype.loadVoiceLibrary = async function() {
    try {
        const response = await this.apiCall('GET', '/voice/library');
        
        if (response.success) {
            this.renderVoiceLibrary(response.voices);
        }
    } catch (error) {
        console.error('Failed to load voice library:', error);
        this.showToast('Failed to load voice library', 'error');
    }
};

PodcastApp.prototype.renderVoiceLibrary = function(voices) {
    const container = document.querySelector('.voice-library');
    if (!container) return;

    if (voices.length === 0) {
        container.innerHTML = `
            <div class="no-voices">
                <i class="fas fa-microphone fa-3x mb-3 text-gray-400"></i>
                <p>No voice samples yet. Upload or record your first voice!</p>
            </div>
        `;
        return;
    }

    // Group voices by type
    const groupedVoices = voices.reduce((acc, voice) => {
        acc[voice.type] = acc[voice.type] || [];
        acc[voice.type].push(voice);
        return acc;
    }, {});

    container.innerHTML = Object.entries(groupedVoices).map(([type, voiceList]) => `
        <div class="voice-section">
            <h3 class="voice-section-title">
                <i class="fas ${type === 'custom' ? 'fa-user' : 'fa-robot'}"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)} Voices
            </h3>
            <div class="voice-grid">
                ${voiceList.map(voice => this.renderVoiceCard(voice)).join('')}
            </div>
        </div>
    `).join('');
};

PodcastApp.prototype.renderVoiceCard = function(voice) {
    return `
        <div class="voice-card" data-id="${voice._id}" data-type="${voice.type}">
            <div class="voice-header">
                <div class="voice-info">
                    <h4>${voice.name}</h4>
                    <span class="voice-type-badge ${voice.type}">${voice.type}</span>
                </div>
                <div class="voice-actions">
                    ${voice.type === 'custom' ? `
                        <button class="btn-icon" onclick="app.testVoice('${voice._id}')" title="Test Voice">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon" onclick="app.editVoice('${voice._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteVoice('${voice._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <button class="btn-icon" onclick="app.testVoice('${voice._id}')" title="Test Voice">
                            <i class="fas fa-play"></i>
                        </button>
                    `}
                </div>
            </div>
            
            <div class="voice-content">
                ${voice.description ? `<p class="voice-description">${voice.description}</p>` : ''}
                
                <div class="voice-meta">
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(voice.createdAt)}</span>
                    ${voice.language ? `<span><i class="fas fa-globe"></i> ${voice.language}</span>` : ''}
                    ${voice.gender ? `<span><i class="fas fa-user"></i> ${voice.gender}</span>` : ''}
                </div>

                ${voice.status === 'processing' ? `
                    <div class="voice-status">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${voice.progress || 0}%"></div>
                        </div>
                        <p class="text-sm">Cloning in progress... ${voice.progress || 0}%</p>
                    </div>
                ` : ''}

                ${voice.status === 'failed' ? `
                    <div class="voice-status error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Cloning failed</span>
                        <button class="btn btn-sm btn-primary" onclick="app.retryVoiceCloning('${voice._id}')">
                            Retry
                        </button>
                    </div>
                ` : ''}

                ${voice.sampleUrl && voice.status === 'ready' ? `
                    <div class="voice-preview">
                        <audio controls>
                            <source src="${voice.sampleUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                ` : ''}
            </div>

            <div class="voice-footer">
                <button class="btn btn-primary ${voice.status !== 'ready' ? 'disabled' : ''}" 
                        onclick="app.useVoiceForPodcast('${voice._id}')"
                        ${voice.status !== 'ready' ? 'disabled' : ''}>
                    <i class="fas fa-microphone"></i> Use for Podcast
                </button>
            </div>
        </div>
    `;
};

PodcastApp.prototype.setupVoicePreview = function() {
    // Pause other audio when one starts playing
    document.addEventListener('play', (e) => {
        if (e.target.tagName === 'AUDIO') {
            document.querySelectorAll('audio').forEach(audio => {
                if (audio !== e.target) {
                    audio.pause();
                }
            });
        }
    }, true);
};

PodcastApp.prototype.filterVoices = function() {
    const searchTerm = document.getElementById('voiceSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    const voiceCards = document.querySelectorAll('.voice-card');
    
    voiceCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const type = card.dataset.type;
        const description = card.querySelector('.voice-description')?.textContent.toLowerCase() || '';
        
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = !categoryFilter || type === categoryFilter;
        
        card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
};

PodcastApp.prototype.testVoice = async function(voiceId) {
    const testText = 'Hello! This is a test of this voice. How does it sound for your podcast?';
    
    try {
        const response = await this.apiCall('POST', `/voice/test/${voiceId}`, {
            text: testText
        });

        if (response.success) {
            // Play the test audio
            const audio = new Audio(response.audioUrl);
            audio.play();
        }
    } catch (error) {
        this.showToast('Failed to test voice', 'error');
    }
};

PodcastApp.prototype.editVoice = async function(voiceId) {
    // Simple implementation - could be expanded with a modal
    const newName = prompt('Enter new name for this voice:');
    if (!newName) return;

    try {
        const response = await this.apiCall('PUT', `/voice/${voiceId}`, {
            name: newName
        });

        if (response.success) {
            this.showToast('Voice updated successfully', 'success');
            this.loadVoiceLibrary();
        }
    } catch (error) {
        this.showToast('Failed to update voice', 'error');
    }
};

PodcastApp.prototype.deleteVoice = async function(voiceId) {
    if (!confirm('Are you sure you want to delete this voice? This action cannot be undone.')) return;

    try {
        const response = await this.apiCall('DELETE', `/voice/${voiceId}`);

        if (response.success) {
            this.showToast('Voice deleted successfully', 'success');
            this.loadVoiceLibrary();
        }
    } catch (error) {
        this.showToast('Failed to delete voice', 'error');
    }
};

PodcastApp.prototype.retryVoiceCloning = async function(voiceId) {
    try {
        const response = await this.apiCall('POST', `/voice/${voiceId}/retry`);

        if (response.success) {
            this.showToast('Voice cloning restarted', 'success');
            this.loadVoiceLibrary();
            this.monitorVoiceCloning(voiceId);
        }
    } catch (error) {
        this.showToast('Failed to retry voice cloning', 'error');
    }
};

PodcastApp.prototype.useVoiceForPodcast = function(voiceId) {
    localStorage.setItem('selectedVoiceId', voiceId);
    window.location.href = '/podcasts.html';
};

PodcastApp.prototype.monitorVoiceCloning = function(voiceId) {
    if (this.voiceMonitors && this.voiceMonitors[voiceId]) {
        return; // Already monitoring
    }

    if (!this.voiceMonitors) {
        this.voiceMonitors = {};
    }

    this.voiceMonitors[voiceId] = setInterval(async () => {
        try {
            const response = await this.apiCall('GET', `/voice/${voiceId}/progress`);
            
            if (response.success) {
                this.updateVoiceProgress(voiceId, response.progress);
                
                if (response.progress.status === 'ready' || response.progress.status === 'failed') {
                    clearInterval(this.voiceMonitors[voiceId]);
                    delete this.voiceMonitors[voiceId];
                    this.loadVoiceLibrary(); // Refresh the list
                }
            }
        } catch (error) {
            console.error('Failed to check voice cloning progress:', error);
        }
    }, 3000);
};

PodcastApp.prototype.updateVoiceProgress = function(voiceId, progress) {
    const voiceCard = document.querySelector(`[data-id="${voiceId}"]`);
    if (!voiceCard) return;

    const progressBar = voiceCard.querySelector('.progress-fill');
    const progressText = voiceCard.querySelector('.text-sm');

    if (progressBar) {
        progressBar.style.width = `${progress.progress || 0}%`;
    }

    if (progressText) {
        progressText.textContent = `Cloning in progress... ${progress.progress || 0}%`;
    }
};

// Cleanup function for voice monitors
PodcastApp.prototype.cleanupVoiceMonitors = function() {
    if (this.voiceMonitors) {
        Object.values(this.voiceMonitors).forEach(interval => clearInterval(interval));
        this.voiceMonitors = {};
    }
};

// Auto-cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.cleanupVoiceMonitors) {
        window.app.cleanupVoiceMonitors();
    }
});
