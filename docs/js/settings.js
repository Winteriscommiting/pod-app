// Extend PodcastApp with settings-specific functionality
PodcastApp.prototype.initializeSettings = async function() {
    await this.loadSettings();
    this.setupSettingsEventListeners();
    this.initializeExportImport();
};

PodcastApp.prototype.setupSettingsEventListeners = function() {
    // General settings form
    const generalForm = document.getElementById('generalSettingsForm');
    if (generalForm) {
        generalForm.addEventListener('submit', (e) => this.handleGeneralSettings(e));
    }

    // Audio settings form
    const audioForm = document.getElementById('audioSettingsForm');
    if (audioForm) {
        audioForm.addEventListener('submit', (e) => this.handleAudioSettings(e));
    }

    // Privacy settings form
    const privacyForm = document.getElementById('privacySettingsForm');
    if (privacyForm) {
        privacyForm.addEventListener('submit', (e) => this.handlePrivacySettings(e));
    }

    // Export/Import functionality
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importFile');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => this.handleDataExport());
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => this.handleDataImport());
    }

    if (importFile) {
        importFile.addEventListener('change', (e) => this.handleImportFileSelect(e));
    }

    // Clear data functionality
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => this.handleClearData());
    }

    // Theme switcher
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => this.handleThemeChange(e));
    }

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
    }

    // Notification preferences
    const notificationCheckboxes = document.querySelectorAll('.notification-setting');
    notificationCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => this.updateNotificationSettings());
    });

    // Storage usage refresh
    const refreshStorageBtn = document.getElementById('refreshStorageBtn');
    if (refreshStorageBtn) {
        refreshStorageBtn.addEventListener('click', () => this.loadStorageUsage());
    }

    // API key management
    this.setupApiKeyManagement();
};

PodcastApp.prototype.loadSettings = async function() {
    try {
        const response = await this.apiCall('GET', '/user/settings');
        
        if (response.success) {
            this.populateSettingsForms(response.settings);
            this.loadStorageUsage();
            this.loadSystemInfo();
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        this.showToast('Failed to load settings', 'error');
    }
};

PodcastApp.prototype.populateSettingsForms = function(settings) {
    // General settings
    const generalForm = document.getElementById('generalSettingsForm');
    if (generalForm && settings.general) {
        if (settings.general.defaultVoice) {
            generalForm.defaultVoice.value = settings.general.defaultVoice;
        }
        if (settings.general.autoSave !== undefined) {
            generalForm.autoSave.checked = settings.general.autoSave;
        }
        if (settings.general.theme) {
            generalForm.theme.value = settings.general.theme;
            this.applyTheme(settings.general.theme);
        }
        if (settings.general.language) {
            generalForm.language.value = settings.general.language;
        }
    }

    // Audio settings
    const audioForm = document.getElementById('audioSettingsForm');
    if (audioForm && settings.audio) {
        if (settings.audio.quality) {
            audioForm.quality.value = settings.audio.quality;
        }
        if (settings.audio.bitrate) {
            audioForm.bitrate.value = settings.audio.bitrate;
        }
        if (settings.audio.speed) {
            audioForm.speed.value = settings.audio.speed;
        }
        if (settings.audio.addIntro !== undefined) {
            audioForm.addIntro.checked = settings.audio.addIntro;
        }
        if (settings.audio.addOutro !== undefined) {
            audioForm.addOutro.checked = settings.audio.addOutro;
        }
    }

    // Privacy settings
    const privacyForm = document.getElementById('privacySettingsForm');
    if (privacyForm && settings.privacy) {
        if (settings.privacy.analytics !== undefined) {
            privacyForm.analytics.checked = settings.privacy.analytics;
        }
        if (settings.privacy.crashReports !== undefined) {
            privacyForm.crashReports.checked = settings.privacy.crashReports;
        }
        if (settings.privacy.dataRetention) {
            privacyForm.dataRetention.value = settings.privacy.dataRetention;
        }
    }

    // Notification settings
    if (settings.notifications) {
        Object.entries(settings.notifications).forEach(([key, value]) => {
            const checkbox = document.getElementById(`notification_${key}`);
            if (checkbox) {
                checkbox.checked = value;
            }
        });
    }
};

PodcastApp.prototype.handleGeneralSettings = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const settings = {
        defaultVoice: formData.get('defaultVoice'),
        autoSave: formData.has('autoSave'),
        theme: formData.get('theme'),
        language: formData.get('language')
    };

    await this.saveSettings('general', settings);
};

PodcastApp.prototype.handleAudioSettings = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const settings = {
        quality: formData.get('quality'),
        bitrate: parseInt(formData.get('bitrate')),
        speed: parseFloat(formData.get('speed')),
        addIntro: formData.has('addIntro'),
        addOutro: formData.has('addOutro')
    };

    await this.saveSettings('audio', settings);
};

PodcastApp.prototype.handlePrivacySettings = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const settings = {
        analytics: formData.has('analytics'),
        crashReports: formData.has('crashReports'),
        dataRetention: formData.get('dataRetention')
    };

    await this.saveSettings('privacy', settings);
};

PodcastApp.prototype.saveSettings = async function(category, settings) {
    try {
        const response = await this.apiCall('PUT', '/user/settings', {
            category,
            settings
        });

        if (response.success) {
            this.showToast('Settings saved successfully!', 'success');
            
            // Apply theme if changed
            if (category === 'general' && settings.theme) {
                this.applyTheme(settings.theme);
            }
        }
    } catch (error) {
        this.showToast(error.message || 'Failed to save settings', 'error');
    }
};

PodcastApp.prototype.updateNotificationSettings = async function() {
    const notifications = {};
    
    document.querySelectorAll('.notification-setting').forEach(checkbox => {
        const key = checkbox.id.replace('notification_', '');
        notifications[key] = checkbox.checked;
    });

    await this.saveSettings('notifications', notifications);
};

PodcastApp.prototype.handleThemeChange = function(e) {
    const theme = e.target.value;
    this.applyTheme(theme);
};

PodcastApp.prototype.applyTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

PodcastApp.prototype.handleLanguageChange = function(e) {
    const language = e.target.value;
    localStorage.setItem('language', language);
    this.showToast('Language will be applied after page refresh', 'info');
};

PodcastApp.prototype.loadStorageUsage = async function() {
    try {
        const response = await this.apiCall('GET', '/user/storage');
        
        if (response.success) {
            this.renderStorageUsage(response.storage);
        }
    } catch (error) {
        console.error('Failed to load storage usage:', error);
    }
};

PodcastApp.prototype.renderStorageUsage = function(storage) {
    const container = document.querySelector('.storage-usage');
    if (!container) return;

    const totalUsed = storage.documents + storage.podcasts + storage.voices;
    const totalLimit = storage.limit || 5000000000; // 5GB default
    const usagePercentage = (totalUsed / totalLimit) * 100;

    container.innerHTML = `
        <div class="storage-overview">
            <div class="storage-bar">
                <div class="storage-fill" style="width: ${usagePercentage}%"></div>
            </div>
            <p class="storage-text">
                ${this.formatFileSize(totalUsed)} of ${this.formatFileSize(totalLimit)} used (${usagePercentage.toFixed(1)}%)
            </p>
        </div>
        
        <div class="storage-breakdown">
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-file-text"></i>
                </div>
                <div class="storage-details">
                    <span class="storage-label">Documents</span>
                    <span class="storage-value">${this.formatFileSize(storage.documents)}</span>
                </div>
            </div>
            
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-microphone"></i>
                </div>
                <div class="storage-details">
                    <span class="storage-label">Podcasts</span>
                    <span class="storage-value">${this.formatFileSize(storage.podcasts)}</span>
                </div>
            </div>
            
            <div class="storage-item">
                <div class="storage-icon">
                    <i class="fas fa-volume-up"></i>
                </div>
                <div class="storage-details">
                    <span class="storage-label">Voice Samples</span>
                    <span class="storage-value">${this.formatFileSize(storage.voices)}</span>
                </div>
            </div>
        </div>
    `;
};

PodcastApp.prototype.loadSystemInfo = function() {
    const container = document.querySelector('.system-info');
    if (!container) return;

    container.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <label>Browser:</label>
                <span>${navigator.userAgent.split(' ')[0] || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <label>Platform:</label>
                <span>${navigator.platform || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <label>Language:</label>
                <span>${navigator.language || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <label>Online Status:</label>
                <span class="${navigator.onLine ? 'online' : 'offline'}">
                    ${navigator.onLine ? 'Online' : 'Offline'}
                </span>
            </div>
            <div class="info-item">
                <label>Local Storage:</label>
                <span>${this.checkLocalStorageSupport() ? 'Supported' : 'Not Supported'}</span>
            </div>
        </div>
    `;
};

PodcastApp.prototype.checkLocalStorageSupport = function() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
};

PodcastApp.prototype.initializeExportImport = function() {
    // File drop zone for import
    const dropZone = document.querySelector('.import-drop-zone');
    const fileInput = document.getElementById('importFile');

    if (dropZone && fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleImportFileSelect({ target: fileInput });
            }
        }, false);

        dropZone.addEventListener('click', () => fileInput.click());
    }
};

PodcastApp.prototype.handleDataExport = async function() {
    try {
        const exportBtn = document.getElementById('exportDataBtn');
        const originalText = exportBtn.textContent;
        
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';

        const response = await this.apiCall('GET', '/user/export');

        if (response.success) {
            // Create and download the export file
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `podcast-app-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast('Data exported successfully!', 'success');
        }
    } catch (error) {
        this.showToast(error.message || 'Export failed', 'error');
    } finally {
        const exportBtn = document.getElementById('exportDataBtn');
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export Data';
    }
};

PodcastApp.prototype.handleImportFileSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = document.querySelector('.import-file-name');
    const importBtn = document.getElementById('importDataBtn');

    if (fileName) {
        fileName.textContent = file.name;
        fileName.style.display = 'block';
    }

    if (importBtn) {
        importBtn.disabled = false;
    }
};

PodcastApp.prototype.handleDataImport = async function() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (!file) {
        this.showToast('Please select a file to import', 'error');
        return;
    }

    if (!confirm('Importing data will overwrite your current settings and may add new content. Continue?')) {
        return;
    }

    try {
        const importBtn = document.getElementById('importDataBtn');
        const originalText = importBtn.textContent;
        
        importBtn.disabled = true;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';

        const formData = new FormData();
        formData.append('importFile', file);

        const response = await this.apiCall('POST', '/user/import', formData, true);

        if (response.success) {
            this.showToast('Data imported successfully! Page will refresh.', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    } catch (error) {
        this.showToast(error.message || 'Import failed', 'error');
    } finally {
        const importBtn = document.getElementById('importDataBtn');
        importBtn.disabled = false;
        importBtn.textContent = 'Import Data';
    }
};

PodcastApp.prototype.handleClearData = async function() {
    const confirmation = prompt('This will delete ALL your data. Type "DELETE ALL" to confirm:');
    
    if (confirmation !== 'DELETE ALL') {
        this.showToast('Data clearing cancelled', 'info');
        return;
    }

    try {
        const response = await this.apiCall('POST', '/user/clear-data');

        if (response.success) {
            this.showToast('All data cleared successfully. Redirecting to login...', 'success');
            
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login.html';
            }, 2000);
        }
    } catch (error) {
        this.showToast(error.message || 'Failed to clear data', 'error');
    }
};

PodcastApp.prototype.setupApiKeyManagement = function() {
    const apiKeyForm = document.getElementById('apiKeyForm');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKey');

    if (toggleApiKey && apiKeyInput) {
        toggleApiKey.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
            toggleApiKey.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    if (apiKeyForm) {
        apiKeyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const apiKey = formData.get('apiKey');

            try {
                const response = await this.apiCall('PUT', '/user/api-key', { apiKey });

                if (response.success) {
                    this.showToast('API key updated successfully!', 'success');
                }
            } catch (error) {
                this.showToast(error.message || 'Failed to update API key', 'error');
            }
        });
    }

    // Test API key button
    const testApiKeyBtn = document.getElementById('testApiKey');
    if (testApiKeyBtn) {
        testApiKeyBtn.addEventListener('click', async () => {
            try {
                const response = await this.apiCall('POST', '/user/test-api-key');

                if (response.success) {
                    this.showToast('API key is valid and working!', 'success');
                } else {
                    this.showToast('API key test failed', 'error');
                }
            } catch (error) {
                this.showToast('API key test failed', 'error');
            }
        });
    }
};

// Tab switching functionality for settings
PodcastApp.prototype.initializeSettingsTabs = function() {
    const tabButtons = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}Settings`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
};

// Initialize settings tabs when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.app && window.app.initializeSettingsTabs) {
        window.app.initializeSettingsTabs();
    }
});
