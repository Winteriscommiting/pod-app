const fs = require('fs');
const path = require('path');

class TextToSpeechService {
  static voices = {
    'voice-1': { name: 'Sarah', lang: 'en-US', gender: 'female', description: 'Professional' },
    'voice-2': { name: 'Michael', lang: 'en-US', gender: 'male', description: 'Narrator' },
    'voice-3': { name: 'Emma', lang: 'en-US', gender: 'female', description: 'Conversational' },
    'voice-4': { name: 'David', lang: 'en-US', gender: 'male', description: 'Authoritative' }
  };

  static async generateAudio(text, options = {}) {
    try {
      const { voice = 'voice-1', settings = {} } = options;
      const { speed = 1, pitch = 1 } = settings;

      // Simulate audio generation process
      const processingTime = Math.min(text.length / 50, 10000); // Max 10 seconds
      
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Create a simple audio buffer simulation
      const audioBuffer = Buffer.alloc(1024 * 100); // 100KB simulated audio
      
      // Calculate estimated duration (words per minute)
      const wordCount = text.split(' ').length;
      const baseWPM = 150;
      const adjustedWPM = baseWPM * speed;
      const duration = Math.ceil((wordCount / adjustedWPM) * 60); // seconds

      return {
        success: true,
        audioBuffer,
        fileSize: audioBuffer.length,
        duration,
        voice,
        settings
      };
    } catch (error) {
      console.error('TTS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static getAvailableVoices() {
    return Object.entries(this.voices).map(([id, voice]) => ({
      id,
      ...voice
    }));
  }

  static estimateAudioDuration(text, speed = 1) {
    // Average speaking rate: 150 words per minute
    const wordCount = text.split(' ').length;
    const baseWPM = 150;
    const adjustedWPM = baseWPM * speed;
    return Math.ceil((wordCount / adjustedWPM) * 60); // Convert to seconds
  }

  static async testVoice(voiceId, text) {
    try {
      if (!this.voices[voiceId]) {
        throw new Error(`Voice ${voiceId} not found`);
      }

      // Simulate test audio generation
      const duration = this.estimateAudioDuration(text);
      
      return {
        success: true,
        url: `/api/voice/test-audio/${voiceId}`,
        duration,
        voiceId
      };
    } catch (error) {
      console.error('Voice test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async splitTextForTTS(text, maxLength = 5000) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Sentence is too long, split by words
          const words = sentence.split(' ');
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + word).length > maxLength) {
              chunks.push(wordChunk.trim());
              wordChunk = word + ' ';
            } else {
              wordChunk += word + ' ';
            }
          }
          if (wordChunk.trim()) {
            chunks.push(wordChunk.trim());
          }
          currentChunk = '';
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

module.exports = TextToSpeechService;
