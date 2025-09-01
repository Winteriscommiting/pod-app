// Document Summarization Management
class SummarizationManager {
    constructor() {
        this.apiBase = '/api/documents';
        this.pollInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSummarizationStats();
        this.loadSummaries();
    }

    bindEvents() {
        // Filter change
        const summaryFilter = document.getElementById('summaryFilter');
        if (summaryFilter) {
            summaryFilter.addEventListener('change', () => {
                this.loadSummaries();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshSummariesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshSummaries();
            });
        }

        // Tab activation
        document.addEventListener('tabChange', (e) => {
            if (e.detail.tab === 'summaries') {
                this.loadSummarizationStats();
                this.loadSummaries();
                this.startPolling();
            } else {
                this.stopPolling();
            }
        });
    }

    async loadSummarizationStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats/summarization`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load stats');
            }

            const result = await response.json();
            this.updateStatsDisplay(result.data);

        } catch (error) {
            console.error('Error loading summarization stats:', error);
            this.showNotification('Failed to load summarization statistics', 'error');
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalDocumentsCount').textContent = stats.totalDocuments || 0;
        document.getElementById('summarizedCount').textContent = stats.summarizedDocuments || 0;
        
        const compressionRatio = stats.averageCompressionRatio ? 
            Math.round(stats.averageCompressionRatio * 100) : 0;
        document.getElementById('avgCompressionRatio').textContent = `${compressionRatio}%`;
        
        document.getElementById('totalReadingTime').textContent = `${stats.totalReadingTime || 0} min`;
    }

    async loadSummaries() {
        try {
            const filter = document.getElementById('summaryFilter')?.value;
            let url = `${this.apiBase}/summaries`;
            
            if (filter) {
                url += `?summarized=${filter === 'completed' ? 'true' : 'false'}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load summaries');
            }

            const result = await response.json();
            this.displaySummaries(result.data);

        } catch (error) {
            console.error('Error loading summaries:', error);
            this.showNotification('Failed to load summaries', 'error');
        }
    }

    displaySummaries(documents) {
        const grid = document.getElementById('summariesGrid');
        if (!grid) return;

        if (documents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-signature"></i>
                    <h3>No summaries found</h3>
                    <p>Upload documents to generate AI summaries</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = documents.map(doc => this.createSummaryCard(doc)).join('');

        // Bind card events
        this.bindCardEvents();
    }

    createSummaryCard(document) {
        const statusIcon = this.getStatusIcon(document.summarizationStatus);
        const statusClass = `status-${document.summarizationStatus}`;
        
        const summary = document.summary || 'No summary available';
        // Show full summary without truncation - let CSS handle display
        const displaySummary = summary;

        return `
            <div class="summary-card" data-id="${document._id}">
                <div class="summary-header">
                    <div class="summary-title">
                        <i class="fas fa-file-${this.getFileIcon(document.fileType)}"></i>
                        <span class="summary-name" title="${document.originalName}">
                            ${document.originalName}
                        </span>
                    </div>
                    <div class="summary-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        <span>${this.formatStatus(document.summarizationStatus)}</span>
                    </div>
                </div>

                <div class="summary-content">
                    ${document.summarizationStatus === 'completed' ? `
                        <div class="summary-text">
                            <p>${displaySummary}</p>
                        </div>
                        
                        <div class="summary-meta">
                            <div class="meta-item">
                                <i class="fas fa-font"></i>
                                <span>${document.wordCount} words</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${document.readingTimeMinutes || 0} min read</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-compress-arrows-alt"></i>
                                <span>${Math.round((document.compressionRatio || 0) * 100)}% compression</span>
                            </div>
                        </div>

                        ${document.keywords && document.keywords.length > 0 ? `
                            <div class="summary-keywords">
                                <strong>Keywords:</strong>
                                ${document.keywords.slice(0, 5).map(keyword => 
                                    `<span class="keyword-tag">${keyword}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    ` : document.summarizationStatus === 'failed' ? `
                        <div class="summary-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Summarization failed: ${document.summarizationError || 'Unknown error'}</p>
                        </div>
                    ` : `
                        <div class="summary-processing">
                            <div class="loading-spinner"></div>
                            <p>Processing document...</p>
                        </div>
                    `}
                </div>

                <div class="summary-actions">
                    <button class="btn btn-outline view-full-summary" 
                            ${document.summarizationStatus !== 'completed' ? 'disabled' : ''}>
                        <i class="fas fa-eye"></i>
                        View Full
                    </button>
                    <button class="btn btn-outline regenerate-summary" 
                            data-id="${document._id}"
                            ${document.summarizationStatus === 'processing' ? 'disabled' : ''}>
                        <i class="fas fa-sync-alt"></i>
                        Regenerate
                    </button>
                    <button class="btn btn-primary create-podcast" 
                            data-id="${document._id}"
                            ${document.summarizationStatus !== 'completed' ? 'disabled' : ''}>
                        <i class="fas fa-microphone"></i>
                        Create Podcast
                    </button>
                    <button class="btn btn-outline delete-document" 
                            data-id="${document._id}"
                            style="color: #ef4444; border-color: #ef4444;">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        const icons = {
            'completed': 'fas fa-check-circle',
            'processing': 'fas fa-spinner fa-spin',
            'pending': 'fas fa-clock',
            'failed': 'fas fa-exclamation-circle'
        };
        return icons[status] || 'fas fa-question-circle';
    }

    getFileIcon(fileType) {
        const icons = {
            'pdf': 'pdf',
            'docx': 'word',
            'txt': 'alt'
        };
        return icons[fileType] || 'alt';
    }

    formatStatus(status) {
        const formatted = {
            'completed': 'Completed',
            'processing': 'Processing',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        return formatted[status] || 'Unknown';
    }

    bindCardEvents() {
        // View full summary
        document.querySelectorAll('.view-full-summary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.summary-card');
                const docId = card.dataset.id;
                this.showFullSummary(docId);
            });
        });

        // Regenerate summary
        document.querySelectorAll('.regenerate-summary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('.regenerate-summary').dataset.id;
                this.regenerateSummary(docId);
            });
        });

        // Create podcast
        document.querySelectorAll('.create-podcast').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('.create-podcast').dataset.id;
                this.createPodcastFromSummary(docId);
            });
        });

        // Delete document
        document.querySelectorAll('.delete-document').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('.delete-document').dataset.id;
                this.deleteDocument(docId);
            });
        });
    }

    async showFullSummary(documentId) {
        try {
            const response = await fetch(`${this.apiBase}/${documentId}/summary`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load full summary');
            }

            const result = await response.json();
            this.displayFullSummaryModal(result.data);

        } catch (error) {
            console.error('Error loading full summary:', error);
            this.showNotification('Failed to load full summary', 'error');
        }
    }

    displayFullSummaryModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>${data.originalName}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="summary-details">
                        <div class="summary-meta-full">
                            <div class="meta-row">
                                <span class="meta-label">Word Count:</span>
                                <span class="meta-value">${data.wordCount}</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-label">Reading Time:</span>
                                <span class="meta-value">${data.readingTimeMinutes} minutes</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-label">Compression Ratio:</span>
                                <span class="meta-value">${Math.round((data.compressionRatio || 0) * 100)}%</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-label">AI Model:</span>
                                <span class="meta-value">${data.model || 'Unknown'}</span>
                            </div>
                        </div>
                        
                        <div class="summary-full-text">
                            <h3>Summary</h3>
                            <p>${data.summary}</p>
                        </div>

                        ${data.keywords && data.keywords.length > 0 ? `
                            <div class="keywords-full">
                                <h3>Keywords</h3>
                                <div class="keywords-list">
                                    ${data.keywords.map(keyword => 
                                        `<span class="keyword-tag">${keyword}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="window.summarizationManager.createPodcastFromSummary('${data.id}')">
                        <i class="fas fa-microphone"></i>
                        Create Podcast
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async regenerateSummary(documentId) {
        try {
            const response = await fetch(`${this.apiBase}/${documentId}/regenerate-summary`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate summary');
            }

            this.showNotification('Summary regeneration started', 'success');
            
            // Refresh the summaries view
            setTimeout(() => {
                this.loadSummaries();
                this.loadSummarizationStats();
            }, 1000);

        } catch (error) {
            console.error('Error regenerating summary:', error);
            this.showNotification('Failed to regenerate summary', 'error');
        }
    }

    createPodcastFromSummary(documentId) {
        // Show creation confirmation
        if (!confirm('Would you like to create a podcast from this document summary?')) {
            return;
        }

        this.createPodcastFromDocument(documentId);
    }

    async createPodcastFromDocument(documentId) {
        try {
            // Show loading notification
            this.showNotification('Creating podcast from summary...', 'info');

            const response = await fetch(`/api/podcasts/from-summary/${documentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voiceType: 'google-us-english-female',
                    voiceSettings: { speed: 0.9, pitch: 1, volume: 1 }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create podcast');
            }

            const result = await response.json();
            
            this.showNotification('Podcast creation started! Check the Podcasts tab for progress.', 'success');
            
            // Switch to podcasts tab to show the new podcast
            document.querySelector('[data-tab="podcasts"]')?.click();

        } catch (error) {
            console.error('Error creating podcast from summary:', error);
            this.showNotification('Failed to create podcast: ' + error.message, 'error');
        }
    }

    refreshSummaries() {
        this.loadSummarizationStats();
        this.loadSummaries();
        this.showNotification('Summaries refreshed', 'success');
    }

    async deleteDocument(documentId) {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            const result = await response.json();
            this.showNotification('Document deleted successfully', 'success');
            
            // Refresh the summaries view and stats
            this.loadSummaries();
            this.loadSummarizationStats();
            
            // Also refresh the documents tab if available
            if (window.loadDocuments) {
                window.loadDocuments();
            }

        } catch (error) {
            console.error('Error deleting document:', error);
            this.showNotification('Failed to delete document', 'error');
        }
    }

    startPolling() {
        // Poll for updates every 10 seconds when on summaries tab
        this.pollInterval = setInterval(() => {
            this.loadSummaries();
            this.loadSummarizationStats();
        }, 10000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create a simple one
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.summarizationManager = new SummarizationManager();
});
