// Browser-based Text-to-Speech Utility (100% Free)
class BrowserTTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isSupported = 'speechSynthesis' in window;
        
        if (this.isSupported) {
            this.loadVoices();
            
            // Listen for voices changed event (voices load asynchronously)
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log('🎤 Browser TTS: Loaded', this.voices.length, 'voices');
    }

    getAvailableVoices() {
        if (!this.isSupported) return [];
        
        return this.voices.map(voice => ({
            id: voice.name.toLowerCase().replace(/\s+/g, '-'),
            name: voice.name,
            gender: this.detectGender(voice.name),
            language: voice.lang,
            isDefault: voice.default,
            localService: voice.localService,
            voiceURI: voice.voiceURI
        }));
    }

    detectGender(voiceName) {
        const name = voiceName.toLowerCase();
        const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'cortana', 'siri', 'alexa', 'samantha', 'victoria', 'anna', 'emma', 'fiona'];
        const maleKeywords = ['male', 'man', 'boy', 'david', 'mark', 'paul', 'daniel', 'alex', 'thomas'];
        
        if (femaleKeywords.some(keyword => name.includes(keyword))) return 'female';
        if (maleKeywords.some(keyword => name.includes(keyword))) return 'male';
        return 'neutral';
    }

    findVoice(voiceId) {
        return this.voices.find(voice => 
            voice.name.toLowerCase().replace(/\s+/g, '-') === voiceId ||
            voice.name === voiceId ||
            voice.voiceURI === voiceId
        ) || this.voices[0]; // Fallback to first available voice
    }

    async generateSpeech(text, options = {}) {
        if (!this.isSupported) {
            throw new Error('Browser TTS not supported');
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Find and set voice
                if (options.voice) {
                    const selectedVoice = this.findVoice(options.voice);
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }

                // Set voice parameters
                utterance.rate = options.rate || 1.0;     // Speed (0.1 to 10)
                utterance.pitch = options.pitch || 1.0;   // Pitch (0 to 2)
                utterance.volume = options.volume || 1.0; // Volume (0 to 1)

                // Set up event listeners
                utterance.onstart = () => {
                    console.log('🎵 TTS: Speech started');
                };

                utterance.onend = () => {
                    console.log('✅ TTS: Speech completed');
                    resolve({
                        success: true,
                        duration: this.estimateDuration(text, utterance.rate),
                        voice: utterance.voice ? utterance.voice.name : 'Default',
                        type: 'browser-tts'
                    });
                };

                utterance.onerror = (event) => {
                    console.error('❌ TTS Error:', event.error);
                    reject(new Error(`TTS Error: ${event.error}`));
                };

                // Store current utterance for potential cancellation
                this.currentUtterance = utterance;

                // Start speech synthesis
                this.synthesis.speak(utterance);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Generate audio blob for download (using MediaRecorder)
    async generateAudioBlob(text, options = {}) {
        if (!this.isSupported) {
            throw new Error('Browser TTS not supported');
        }

        return new Promise((resolve, reject) => {
            try {
                // Create audio context for recording
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const destination = audioContext.createMediaStreamDestination();
                const mediaRecorder = new MediaRecorder(destination.stream);
                const audioChunks = [];

                // Set up MediaRecorder
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    resolve({
                        success: true,
                        blob: audioBlob,
                        size: audioBlob.size,
                        duration: this.estimateDuration(text, options.rate || 1.0),
                        type: 'audio/wav'
                    });
                };

                // Create utterance
                const utterance = new SpeechSynthesisUtterance(text);
                
                if (options.voice) {
                    const selectedVoice = this.findVoice(options.voice);
                    if (selectedVoice) utterance.voice = selectedVoice;
                }

                utterance.rate = options.rate || 1.0;
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || 1.0;

                utterance.onstart = () => {
                    mediaRecorder.start();
                };

                utterance.onend = () => {
                    setTimeout(() => mediaRecorder.stop(), 500); // Small delay to ensure all audio is captured
                };

                utterance.onerror = (event) => {
                    mediaRecorder.stop();
                    reject(new Error(`TTS Error: ${event.error}`));
                };

                // Start speech synthesis
                this.synthesis.speak(utterance);

            } catch (error) {
                reject(error);
            }
        });
    }

    stopSpeech() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }

    pauseSpeech() {
        if (this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }

    resumeSpeech() {
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    estimateDuration(text, rate = 1.0) {
        // Average speaking rate: 150-200 words per minute
        const wordsPerMinute = 175 * rate;
        const wordCount = text.split(/\s+/).length;
        return Math.ceil((wordCount / wordsPerMinute) * 60); // Duration in seconds
    }

    // Test voice with sample text
    async testVoice(voiceId, testText = 'Hello! This is a test of the selected voice. How does it sound?') {
        try {
            const result = await this.generateSpeech(testText, { voice: voiceId });
            utils.showToast('Voice test completed successfully!', 'success');
            return result;
        } catch (error) {
            utils.showToast(`Voice test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Get status information
    getStatus() {
        return {
            supported: this.isSupported,
            speaking: this.synthesis.speaking,
            paused: this.synthesis.paused,
            pending: this.synthesis.pending,
            voicesLoaded: this.voices.length > 0,
            voiceCount: this.voices.length
        };
    }

    // Check if specific voice is available
    isVoiceAvailable(voiceId) {
        return this.voices.some(voice => 
            voice.name.toLowerCase().replace(/\s+/g, '-') === voiceId ||
            voice.name === voiceId
        );
    }
}

// Initialize Browser TTS Manager
const browserTTS = new BrowserTTSManager();

// Export for global use
window.browserTTS = browserTTS;

// Integration with existing utils
if (typeof utils !== 'undefined') {
    utils.browserTTS = browserTTS;
}

console.log('🎤 Browser TTS Manager initialized:', browserTTS.getStatus());
