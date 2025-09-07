// Document Summarization Management
class SummarizationManager {
    constructor() {
        console.log('🏗️ Creating SummarizationManager...');
        this.apiBase = API_BASE_URL;
        this.pollInterval = null;
        console.log('🔗 API Base URL:', this.apiBase);
        this.init();
    }

    init() {
        console.log('📝 Initializing Summarization Manager');
        this.bindEvents();
        // Don't auto-load on init, let dashboard control this
        console.log('✅ Summarization Manager initialized');
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

        // No need for custom tabChange event since dashboard.js calls methods directly
        console.log('📝 Events bound for summarization manager');
    }

    async loadSummarizationStats() {
        try {
            console.log('📊 Loading summarization stats...');
            const response = await fetch(`${this.apiBase}/summaries`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load stats');
            }

            const result = await response.json();
            console.log('📊 Stats loaded:', result.stats);
            this.updateStatsDisplay(result.stats);

        } catch (error) {
            console.error('Error loading summarization stats:', error);
            this.showNotification('Failed to load summarization statistics', 'error');
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalDocumentsCount').textContent = stats.totalDocuments || 0;
        document.getElementById('summarizedCount').textContent = stats.summarizedCount || 0;
        
        const compressionRatio = stats.avgCompressionRatio || 0;
        document.getElementById('avgCompressionRatio').textContent = `${compressionRatio}%`;
        
        document.getElementById('totalReadingTime').textContent = `${stats.totalReadingTime || 0} min`;
    }

    async loadSummaries() {
        try {
            console.log('📝 Loading summaries...');
            const filter = document.getElementById('summaryFilter')?.value;
            let url = `${this.apiBase}/summaries`;
            
            if (filter) {
                url += `?status=${filter}`;
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
            console.log('📝 Summaries loaded:', result.data?.length || 0);
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
        const hasSummary = document.summary && document.summary.trim().length > 0;
        const status = hasSummary ? 'completed' : (document.status === 'error' ? 'failed' : 'pending');
        const statusIcon = this.getStatusIcon(status);
        const statusClass = `status-${status}`;
        
        const fileType = document.fileType?.replace('.', '') || 'alt';
        const fileIcon = this.getFileIcon(fileType);
        
        return `
            <div class="summary-card" data-id="${document._id}">
                <div class="summary-header">
                    <div class="summary-title">
                        <i class="fas fa-file-${fileIcon}"></i>
                        <span class="summary-name" title="${document.title}">
                            ${document.title}
                        </span>
                    </div>
                    <div class="summary-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        <span>${this.formatStatus(status)}</span>
                    </div>
                </div>

                <div class="summary-content">
                    ${hasSummary ? `
                        <div class="summary-text">
                            <p>${document.summary}</p>
                        </div>
                        
                        <div class="summary-meta">
                            <div class="meta-item">
                                <i class="fas fa-font"></i>
                                <span>${document.wordCount || 0} words</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${document.readingTime || 0} min read</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-compress-arrows-alt"></i>
                                <span>${document.compressionRatio || 0}% compression</span>
                            </div>
                        </div>
                    ` : `
                        <div class="summary-placeholder">
                            ${status === 'pending' ? 
                                '<p>Summary not generated yet. <button class="btn btn-small summarize-btn" data-id="' + document._id + '">Generate Summary</button></p>' : 
                                '<p>Summary generation failed.</p>'
                            }
                        </div>
                    `}
                </div>

                <div class="summary-actions">
                    ${hasSummary ? `
                        <button class="btn btn-small btn-secondary copy-summary-btn" data-id="${document._id}">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    ` : ''}
                    <button class="btn btn-small btn-secondary view-document-btn" data-id="${document._id}">
                        <i class="fas fa-file"></i> View Document
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
            'doc': 'word',
            'txt': 'text'
        };
        return icons[fileType] || 'alt';
    }

    formatStatus(status) {
        const statusLabels = {
            'completed': 'Summarized',
            'processing': 'Processing...',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        return statusLabels[status] || 'Unknown';
    }

    bindCardEvents() {
        // Summarize button
        document.querySelectorAll('.summarize-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const documentId = e.target.dataset.id;
                this.summarizeDocument(documentId);
            });
        });

        // Copy summary button
        document.querySelectorAll('.copy-summary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const documentId = e.target.dataset.id;
                this.copySummary(documentId);
            });
        });

        // View document button
        document.querySelectorAll('.view-document-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const documentId = e.target.dataset.id;
                this.viewDocument(documentId);
            });
        });
    }

    async summarizeDocument(documentId) {
        try {
            console.log('📝 Starting summarization for document:', documentId);
            
            const response = await fetch(`${this.apiBase}/documents/${documentId}/summarize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to start summarization');
            }

            const result = await response.json();
            console.log('✅ Summarization completed:', result.data);
            
            this.showNotification('Document summarized successfully!', 'success');
            this.loadSummaries();
            this.loadSummarizationStats();

        } catch (error) {
            console.error('❌ Summarization error:', error);
            this.showNotification('Failed to summarize document', 'error');
        }
    }

    async copySummary(documentId) {
        try {
            const card = document.querySelector(`[data-id="${documentId}"]`);
            const summaryText = card.querySelector('.summary-text p').textContent;
            
            await navigator.clipboard.writeText(summaryText);
            this.showNotification('Summary copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy summary:', error);
            this.showNotification('Failed to copy summary', 'error');
        }
    }

    viewDocument(documentId) {
        // Navigate to documents tab and highlight the document
        if (window.switchTab) {
            window.switchTab('documents');
        }
        // Could implement document viewing modal here
    }

    refreshSummaries() {
        this.loadSummaries();
        this.loadSummarizationStats();
        this.showNotification('Summaries refreshed', 'info');
    }

    startPolling() {
        if (this.pollInterval) return;
        
        this.pollInterval = setInterval(() => {
            this.loadSummaries();
        }, 10000); // Poll every 10 seconds
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        if (window.utils && utils.showToast) {
            utils.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SummarizationManager;
}
