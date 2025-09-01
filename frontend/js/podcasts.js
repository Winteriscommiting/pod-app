// ===== PODCAST MANAGEMENT FUNCTIONALITY =====

// Extend PodcastApp with podcast-specific functionality
PodcastApp.prototype.initializePodcasts = async function() {
    await this.loadPodcasts();
    await this.loadDocumentsForPodcast();
    await this.loadVoiceSamples();
    this.setupPodcastEventListeners();
    this.checkSelectedDocument();
};

PodcastApp.prototype.setupPodcastEventListeners = function() {
    const createForm = document.getElementById('createPodcastForm');
    const bulkCreateBtn = document.getElementById('bulkCreateBtn');
    const searchInput = document.getElementById('podcastSearch');
    const filterSelect = document.getElementById('statusFilter');

    if (createForm) {
        createForm.addEventListener('submit', (e) => this.handlePodcastCreation(e));
    }

    if (bulkCreateBtn) {
        bulkCreateBtn.addEventListener('click', () => this.handleBulkCreation());
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => this.filterPodcasts());
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => this.filterPodcasts());
    }

    // Voice selection
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', (e) => this.handleVoiceChange(e));
    }

    // Document selection
    const documentSelect = document.getElementById('documentSelect');
    if (documentSelect) {
        documentSelect.addEventListener('change', (e) => this.handleDocumentChange(e));
    }

    // Audio preview
    this.setupAudioPlayers();
};

PodcastApp.prototype.checkSelectedDocument = function() {
    const selectedDocumentId = localStorage.getItem('selectedDocumentId');
    if (selectedDocumentId) {
        const documentSelect = document.getElementById('documentSelect');
        if (documentSelect) {
            documentSelect.value = selectedDocumentId;
            this.handleDocumentChange({ target: documentSelect });
        }
        localStorage.removeItem('selectedDocumentId');
    }
};

PodcastApp.prototype.loadDocumentsForPodcast = async function() {
    try {
        const response = await this.apiCall('GET', '/documents');
        
        if (response.success) {
            this.populateDocumentSelect(response.documents);
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
};

PodcastApp.prototype.populateDocumentSelect = function(documents) {
    const documentSelect = document.getElementById('documentSelect');
    if (!documentSelect) return;

    documentSelect.innerHTML = '<option value="">Select a document...</option>' +
        documents.map(doc => `
            <option value="${doc._id}">${doc.title} (${doc.fileType.toUpperCase()})</option>
        `).join('');
};

PodcastApp.prototype.loadVoiceSamples = async function() {
    try {
        const response = await this.apiCall('GET', '/voice/samples');
        
        if (response.success) {
            this.populateVoiceSelect(response.voices);
        }
    } catch (error) {
        console.error('Failed to load voice samples:', error);
    }
};

PodcastApp.prototype.populateVoiceSelect = function(voices) {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect) return;

    voiceSelect.innerHTML = '<option value="">Select a voice...</option>' +
        voices.map(voice => `
            <option value="${voice._id}" data-type="${voice.type}">${voice.name} (${voice.type})</option>
        `).join('');
};

PodcastApp.prototype.handleDocumentChange = async function(e) {
    const documentId = e.target.value;
    const documentPreview = document.querySelector('.document-preview');
    const titleInput = document.getElementById('podcastTitle');

    if (!documentId) {
        if (documentPreview) documentPreview.style.display = 'none';
        return;
    }

    try {
        const response = await this.apiCall('GET', `/documents/${documentId}`);
        
        if (response.success) {
            const doc = response.document;
            
            // Auto-fill title
            if (titleInput && !titleInput.value) {
                titleInput.value = `Podcast: ${doc.title}`;
            }

            // Show document preview
            if (documentPreview) {
                documentPreview.innerHTML = `
                    <div class="document-info">
                        <h4><i class="fas ${this.getFileIcon(doc.fileType)}"></i> ${doc.title}</h4>
                        <p class="text-gray-600">${doc.summary || 'No summary available'}</p>
                        <div class="document-meta">
                            <span><i class="fas fa-file"></i> ${doc.fileType.toUpperCase()}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(doc.createdAt)}</span>
                            <span><i class="fas fa-hdd"></i> ${this.formatFileSize(doc.fileSize)}</span>
                        </div>
                    </div>
                `;
                documentPreview.style.display = 'block';
            }

            // Estimate duration
            this.updateDurationEstimate(doc);
        }
    } catch (error) {
        console.error('Failed to load document details:', error);
    }
};

PodcastApp.prototype.handleVoiceChange = function(e) {
    const voiceId = e.target.value;
    const selectedOption = e.target.selectedOptions[0];
    const voicePreview = document.querySelector('.voice-preview');

    if (!voiceId) {
        if (voicePreview) voicePreview.style.display = 'none';
        return;
    }

    const voiceType = selectedOption.dataset.type;
    const voiceName = selectedOption.textContent;

    if (voicePreview) {
        voicePreview.innerHTML = `
            <div class="voice-info">
                <h4><i class="fas fa-microphone"></i> ${voiceName}</h4>
                <span class="voice-type-badge ${voiceType}">${voiceType}</span>
                ${voiceType === 'custom' ? '<p class="text-sm text-gray-600">Custom cloned voice</p>' : ''}
            </div>
        `;
        voicePreview.style.display = 'block';
    }

    // Update duration estimate if document is selected
    const documentSelect = document.getElementById('documentSelect');
    if (documentSelect && documentSelect.value) {
        this.updateDurationEstimate();
    }
};

PodcastApp.prototype.updateDurationEstimate = function(document) {
    const estimateElement = document.querySelector('.duration-estimate');
    if (!estimateElement) return;

    const documentSelect = document.getElementById('documentSelect');
    const voiceSelect = document.getElementById('voiceSelect');

    if (!documentSelect.value || !voiceSelect.value) {
        estimateElement.style.display = 'none';
        return;
    }

    // Estimate based on content length (rough calculation)
    const wordsPerMinute = 150; // Average speaking rate
    const estimatedWords = document ? document.content?.split(' ').length || 1000 : 1000;
    const estimatedMinutes = Math.ceil(estimatedWords / wordsPerMinute);

    estimateElement.innerHTML = `
        <div class="estimate-info">
            <i class="fas fa-clock"></i>
            <span>Estimated duration: ~${estimatedMinutes} minutes</span>
        </div>
    `;
    estimateElement.style.display = 'block';
};

PodcastApp.prototype.handlePodcastCreation = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Validation
    if (!data.documentId) {
        this.showToast('Please select a document', 'error');
        return;
    }

    if (!data.voiceId) {
        this.showToast('Please select a voice', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating podcast...';

        const response = await this.apiCall('POST', '/podcasts', data);

        if (response.success) {
            this.showToast('Podcast creation started! You can monitor progress below.', 'success');
            form.reset();
            document.querySelector('.document-preview').style.display = 'none';
            document.querySelector('.voice-preview').style.display = 'none';
            document.querySelector('.duration-estimate').style.display = 'none';
            
            // Refresh podcasts list
            this.loadPodcasts();
            
            // Start monitoring the new podcast
            this.monitorPodcastProgress(response.podcast._id);
        }
    } catch (error) {
        this.showToast(error.message || 'Failed to create podcast', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

PodcastApp.prototype.handleBulkCreation = async function() {
    const selectedDocs = Array.from(document.querySelectorAll('.document-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedDocs.length === 0) {
        this.showToast('Please select at least one document', 'error');
        return;
    }

    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect.value) {
        this.showToast('Please select a voice for bulk creation', 'error');
        return;
    }

    if (!confirm(`Create ${selectedDocs.length} podcasts with the selected voice?`)) {
        return;
    }

    try {
        const response = await this.apiCall('POST', '/podcasts/bulk', {
            documentIds: selectedDocs,
            voiceId: voiceSelect.value
        });

        if (response.success) {
            this.showToast(`Started creating ${selectedDocs.length} podcasts!`, 'success');
            this.loadPodcasts();
            
            // Monitor all new podcasts
            response.podcasts.forEach(podcast => {
                this.monitorPodcastProgress(podcast._id);
            });
        }
    } catch (error) {
        this.showToast(error.message || 'Bulk creation failed', 'error');
    }
};

PodcastApp.prototype.loadPodcasts = async function() {
    try {
        const response = await this.apiCall('GET', '/podcasts');
        
        if (response.success) {
            this.renderPodcasts(response.podcasts);
        }
    } catch (error) {
        console.error('Failed to load podcasts:', error);
        this.showToast('Failed to load podcasts', 'error');
    }
};

PodcastApp.prototype.renderPodcasts = function(podcasts) {
    const container = document.querySelector('.podcasts-grid');
    if (!container) return;

    if (podcasts.length === 0) {
        container.innerHTML = `
            <div class="no-podcasts">
                <i class="fas fa-microphone fa-3x mb-3 text-gray-400"></i>
                <p>No podcasts created yet. Create your first podcast from a document!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = podcasts.map(podcast => `
        <div class="podcast-card" data-id="${podcast._id}">
            <div class="podcast-header">
                <div class="podcast-status">
                    <span class="status-badge ${podcast.status}">${podcast.status}</span>
                </div>
                <div class="podcast-actions">
                    ${podcast.status === 'completed' ? `
                        <button class="btn-icon" onclick="app.downloadPodcast('${podcast._id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="app.deletePodcast('${podcast._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="podcast-content">
                <h4>${podcast.title}</h4>
                <p class="podcast-meta">
                    <span><i class="fas fa-file"></i> ${podcast.document?.title || 'Document'}</span>
                    <span><i class="fas fa-microphone"></i> ${podcast.voice?.name || 'Voice'}</span>
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(podcast.createdAt)}</span>
                </p>
                
                ${podcast.status === 'processing' ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${podcast.progress || 0}%"></div>
                    </div>
                    <p class="text-sm text-gray-600">Processing... ${podcast.progress || 0}%</p>
                ` : ''}
                
                ${podcast.status === 'completed' ? `
                    <div class="audio-player" data-podcast-id="${podcast._id}">
                        <audio controls>
                            <source src="/podcasts/${podcast._id}/audio" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                        <div class="audio-info">
                            <span><i class="fas fa-clock"></i> ${this.formatDuration(podcast.duration)}</span>
                            <span><i class="fas fa-hdd"></i> ${this.formatFileSize(podcast.fileSize)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${podcast.status === 'failed' ? `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Generation failed: ${podcast.error || 'Unknown error'}</span>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="app.retryPodcast('${podcast._id}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Start monitoring any processing podcasts
    podcasts.filter(p => p.status === 'processing').forEach(podcast => {
        this.monitorPodcastProgress(podcast._id);
    });
};

PodcastApp.prototype.monitorPodcastProgress = function(podcastId) {
    if (this.progressMonitors && this.progressMonitors[podcastId]) {
        return; // Already monitoring
    }

    if (!this.progressMonitors) {
        this.progressMonitors = {};
    }

    this.progressMonitors[podcastId] = setInterval(async () => {
        try {
            const response = await this.apiCall('GET', `/podcasts/${podcastId}/progress`);
            
            if (response.success) {
                this.updatePodcastProgress(podcastId, response.progress);
                
                if (response.progress.status === 'completed' || response.progress.status === 'failed') {
                    clearInterval(this.progressMonitors[podcastId]);
                    delete this.progressMonitors[podcastId];
                    this.loadPodcasts(); // Refresh the list
                }
            }
        } catch (error) {
            console.error('Failed to check podcast progress:', error);
        }
    }, 2000);
};

PodcastApp.prototype.updatePodcastProgress = function(podcastId, progress) {
    const podcastCard = document.querySelector(`[data-id="${podcastId}"]`);
    if (!podcastCard) return;

    const progressBar = podcastCard.querySelector('.progress-fill');
    const progressText = podcastCard.querySelector('.text-sm');

    if (progressBar) {
        progressBar.style.width = `${progress.progress || 0}%`;
    }

    if (progressText) {
        progressText.textContent = `Processing... ${progress.progress || 0}%`;
    }
};

PodcastApp.prototype.filterPodcasts = function() {
    const searchTerm = document.getElementById('podcastSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const podcastCards = document.querySelectorAll('.podcast-card');
    
    podcastCards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const status = card.querySelector('.status-badge').textContent.toLowerCase();
        
        const matchesSearch = title.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        card.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
    });
};

PodcastApp.prototype.downloadPodcast = async function(podcastId) {
    try {
        const response = await fetch(`${this.baseUrl}/podcasts/${podcastId}/download`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'podcast.mp3';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            throw new Error('Download failed');
        }
    } catch (error) {
        this.showToast('Download failed', 'error');
    }
};

PodcastApp.prototype.deletePodcast = async function(podcastId) {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
        const response = await this.apiCall('DELETE', `/podcasts/${podcastId}`);
        
        if (response.success) {
            this.showToast('Podcast deleted successfully', 'success');
            this.loadPodcasts();
            
            // Stop monitoring if it was being monitored
            if (this.progressMonitors && this.progressMonitors[podcastId]) {
                clearInterval(this.progressMonitors[podcastId]);
                delete this.progressMonitors[podcastId];
            }
        }
    } catch (error) {
        this.showToast('Failed to delete podcast', 'error');
    }
};

PodcastApp.prototype.retryPodcast = async function(podcastId) {
    try {
        const response = await this.apiCall('POST', `/podcasts/${podcastId}/retry`);
        
        if (response.success) {
            this.showToast('Podcast generation restarted', 'success');
            this.loadPodcasts();
            this.monitorPodcastProgress(podcastId);
        }
    } catch (error) {
        this.showToast('Failed to retry podcast generation', 'error');
    }
};

PodcastApp.prototype.setupAudioPlayers = function() {
    // Audio player enhancements will be handled by browser's default controls
    // Additional custom player features can be added here if needed
    document.addEventListener('play', (e) => {
        if (e.target.tagName === 'AUDIO') {
            // Pause other audio players when one starts
            document.querySelectorAll('audio').forEach(audio => {
                if (audio !== e.target) {
                    audio.pause();
                }
            });
        }
    }, true);
};

PodcastApp.prototype.playPodcast = function(podcastId) {
    const audioPlayer = document.querySelector(`[data-podcast-id="${podcastId}"] audio`);
    if (audioPlayer) {
        audioPlayer.play();
    }
};

// Cleanup function for when leaving the page
PodcastApp.prototype.cleanupPodcastMonitors = function() {
    if (this.progressMonitors) {
        Object.values(this.progressMonitors).forEach(interval => clearInterval(interval));
        this.progressMonitors = {};
    }
};

// Auto-cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.cleanupPodcastMonitors) {
        window.app.cleanupPodcastMonitors();
    }
});
