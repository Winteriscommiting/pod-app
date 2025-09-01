const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Free TTS Provider implementations
class BrowserTTSProvider {
  constructor() {
    this.name = 'Browser Speech Synthesis';
  }

  async generateSpeech(text, voice, options = {}) {
    // This will be handled by the frontend using Web Speech API
    // Return a placeholder that indicates browser-based generation
    return Buffer.from(JSON.stringify({
      type: 'browser-tts',
      text: text,
      voice: voice,
      options: options
    }));
  }

  getAvailableVoices() {
    // Standard browser voices that are commonly available
    return [
      { id: 'google-us-english-female', name: 'Google US English Female', gender: 'female', language: 'en-US' },
      { id: 'google-us-english-male', name: 'Google US English Male', gender: 'male', language: 'en-US' },
      { id: 'microsoft-zira-desktop', name: 'Microsoft Zira', gender: 'female', language: 'en-US' },
      { id: 'microsoft-david-desktop', name: 'Microsoft David', gender: 'male', language: 'en-US' },
      { id: 'apple-samantha', name: 'Apple Samantha', gender: 'female', language: 'en-US' },
      { id: 'espeak-english', name: 'eSpeak English', gender: 'neutral', language: 'en-US' }
    ];
  }
}

class ESpeakProvider {
  constructor() {
    this.name = 'eSpeak (Open Source)';
  }

  async generateSpeech(text, voice, options = {}) {
    // eSpeak is a free, open-source TTS engine
    // This would require eSpeak to be installed on the system
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const espeak = spawn('espeak', [
          '-s', (options.speed || 1) * 175, // Speed in words per minute
          '-v', voice || 'en',
          '-w', '/dev/stdout', // Output to stdout
          text
        ]);

        const chunks = [];
        espeak.stdout.on('data', (chunk) => chunks.push(chunk));
        espeak.on('close', (code) => {
          if (code === 0) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error('eSpeak generation failed'));
          }
        });
        espeak.on('error', reject);
      });
    } catch (error) {
      throw new Error('eSpeak not available on this system');
    }
  }

  getAvailableVoices() {
    return [
      { id: 'en', name: 'English', gender: 'neutral', language: 'en-US' },
      { id: 'en+m1', name: 'English Male 1', gender: 'male', language: 'en-US' },
      { id: 'en+m2', name: 'English Male 2', gender: 'male', language: 'en-US' },
      { id: 'en+f1', name: 'English Female 1', gender: 'female', language: 'en-US' },
      { id: 'en+f2', name: 'English Female 2', gender: 'female', language: 'en-US' }
    ];
  }
}

class FestivalProvider {
  constructor() {
    this.name = 'Festival (Open Source)';
  }

  async generateSpeech(text, voice, options = {}) {
    // Festival is another free, open-source TTS engine
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const festival = spawn('text2wave', ['-o', '/dev/stdout'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        festival.stdin.write(text);
        festival.stdin.end();

        const chunks = [];
        festival.stdout.on('data', (chunk) => chunks.push(chunk));
        festival.on('close', (code) => {
          if (code === 0) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error('Festival generation failed'));
          }
        });
        festival.on('error', reject);
      });
    } catch (error) {
      throw new Error('Festival not available on this system');
    }
  }

  getAvailableVoices() {
    return [
      { id: 'kal_diphone', name: 'Kevin (Male)', gender: 'male', language: 'en-US' },
      { id: 'awb_cmu', name: 'AWB (Male)', gender: 'male', language: 'en-US' },
      { id: 'rms_cmu', name: 'RMS (Male)', gender: 'male', language: 'en-US' }
    ];
  }
}

// Deprecated paid providers (kept for reference but not used)
class OpenAITTSProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1/audio/speech';
    this.deprecated = true;
  }

  async generateSpeech(text, voice, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: options.speed || 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.statusText}`);
    }

    return await response.buffer();
  }

  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'en-US' },
      { id: 'echo', name: 'Echo', gender: 'male', language: 'en-US' },
      { id: 'fable', name: 'Fable', gender: 'neutral', language: 'en-US' },
      { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en-US' },
      { id: 'nova', name: 'Nova', gender: 'female', language: 'en-US' },
      { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en-US' }
    ];
  }
}

class ElevenLabsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.elevenlabs.io/v1';
  }

  async generateSpeech(text, voiceId, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity || 0.5,
          style: options.style || 0.0,
          use_speaker_boost: options.speakerBoost || true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return await response.buffer();
  }

  async getAvailableVoices() {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.baseURL}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      language: voice.labels?.language || 'en',
      gender: voice.labels?.gender || 'unknown'
    }));
  }

  async cloneVoice(name, description, files) {
    const fetch = (await import('node-fetch')).default;
    const FormData = require('form-data');
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    files.forEach((file, index) => {
      formData.append('files', fs.createReadStream(file.path), file.originalname);
    });

    const response = await fetch(`${this.baseURL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs voice cloning error: ${response.statusText}`);
    }

    return await response.json();
  }
}

class AWSPollyProvider {
  constructor(accessKeyId, secretAccessKey, region = 'us-east-1') {
    this.AWS = require('aws-sdk');
    this.polly = new this.AWS.Polly({
      accessKeyId,
      secretAccessKey,
      region
    });
  }

  async generateSpeech(text, voiceId, options = {}) {
    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: options.engine || 'neural',
      SampleRate: options.sampleRate || '22050'
    };

    if (options.speed && options.speed !== 1.0) {
      params.Text = `<speak><prosody rate="${options.speed * 100}%">${text}</prosody></speak>`;
      params.TextType = 'ssml';
    }

    const result = await this.polly.synthesizeSpeech(params).promise();
    return result.AudioStream;
  }

  async getAvailableVoices() {
    const result = await this.polly.describeVoices().promise();
    return result.Voices.map(voice => ({
      id: voice.Id,
      name: voice.Name,
      gender: voice.Gender,
      language: voice.LanguageCode,
      supportedEngines: voice.SupportedEngines
    }));
  }
}

class TextToSpeechService {
  constructor() {
    this.provider = null;
    this.audioDir = path.join(__dirname, '../uploads/audio');
    this.ensureAudioDirectory();
    this.initializeProvider();
  }

  ensureAudioDirectory() {
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  initializeProvider() {
    // Always use free providers - no API keys required!
    const ttsProvider = process.env.TTS_PROVIDER || 'browser';
    
    switch (ttsProvider.toLowerCase()) {
      case 'espeak':
        this.provider = new ESpeakProvider();
        console.log('🎤 TTS Provider: eSpeak (Open Source)');
        break;
      case 'festival':
        this.provider = new FestivalProvider();
        console.log('🎤 TTS Provider: Festival (Open Source)');
        break;
      case 'browser':
      default:
        this.provider = new BrowserTTSProvider();
        console.log('🎤 TTS Provider: Browser Speech Synthesis (Free)');
        break;
    }
  }

  async generateAudio(text, options = {}) {
    try {
      const { voice = 'google-us-english-female', settings = {} } = options;
      
      // For browser-based TTS, we'll return instructions for frontend
      if (this.provider instanceof BrowserTTSProvider) {
        const hash = crypto.createHash('md5').update(text + JSON.stringify(options)).digest('hex');
        const filename = `browser-tts-${hash}-${Date.now()}.json`;
        const filepath = path.join(this.audioDir, filename);

        const ttsInstructions = {
          type: 'browser-tts',
          text: text,
          voice: voice,
          settings: {
            rate: settings.speed || 1.0,
            pitch: settings.pitch || 1.0,
            volume: settings.volume || 1.0
          }
        };

        // Save instructions for the frontend
        fs.writeFileSync(filepath, JSON.stringify(ttsInstructions, null, 2));

        // Calculate duration estimate
        const wordCount = text.split(/\s+/).length;
        const duration = Math.ceil((wordCount / 150) * 60); // 150 WPM average

        return {
          success: true,
          filename,
          filepath,
          fileSize: Buffer.byteLength(JSON.stringify(ttsInstructions)),
          duration,
          voice,
          settings,
          type: 'browser-tts'
        };
      }

      // For system-based TTS (eSpeak, Festival)
      const hash = crypto.createHash('md5').update(text + JSON.stringify(options)).digest('hex');
      const filename = `tts-${hash}-${Date.now()}.wav`;
      const filepath = path.join(this.audioDir, filename);

      // Generate audio using the configured provider
      const audioBuffer = await this.provider.generateSpeech(text, voice, settings);
      
      // Save to file
      fs.writeFileSync(filepath, audioBuffer);

      // Calculate duration estimate
      const wordCount = text.split(/\s+/).length;
      const duration = Math.ceil((wordCount / 150) * 60); // 150 WPM average

      return {
        success: true,
        filename,
        filepath,
        fileSize: audioBuffer.length,
        duration,
        voice,
        settings
      };
    } catch (error) {
      console.error('TTS Generation Error:', error);
      
      // Fallback to browser TTS if system TTS fails
      if (!(this.provider instanceof BrowserTTSProvider)) {
        console.log('🔄 Falling back to browser TTS...');
        this.provider = new BrowserTTSProvider();
        return this.generateAudio(text, options);
      }
      
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }

  async getAvailableVoices() {
    try {
      return this.provider.getAvailableVoices();
    } catch (error) {
      console.error('Error fetching voices:', error);
      return this.getDefaultVoices();
    }
  }

  getDefaultVoices() {
    return [
      { id: 'google-us-english-female', name: 'Google US English Female', gender: 'female', language: 'en-US' },
      { id: 'google-us-english-male', name: 'Google US English Male', gender: 'male', language: 'en-US' },
      { id: 'microsoft-zira-desktop', name: 'Microsoft Zira', gender: 'female', language: 'en-US' },
      { id: 'microsoft-david-desktop', name: 'Microsoft David', gender: 'male', language: 'en-US' },
      { id: 'apple-samantha', name: 'Apple Samantha', gender: 'female', language: 'en-US' },
      { id: 'espeak-english', name: 'eSpeak English', gender: 'neutral', language: 'en-US' }
    ];
  }

  async cloneVoice(name, description, audioFiles) {
    throw new Error('Voice cloning is not available with free TTS providers');
  }

  async validateVoiceId(voiceId) {
    const voices = await this.getAvailableVoices();
    return voices.some(voice => voice.id === voiceId);
  }

  getAudioFilePath(filename) {
    return path.join(this.audioDir, filename);
  }

  deleteAudioFile(filename) {
    const filepath = this.getAudioFilePath(filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }

  // Check if current provider supports real audio generation
  supportsRealAudio() {
    return !(this.provider instanceof BrowserTTSProvider);
  }

  // Get provider information
  getProviderInfo() {
    return {
      name: this.provider.name,
      type: this.provider instanceof BrowserTTSProvider ? 'browser' : 'system',
      supportsRealAudio: this.supportsRealAudio(),
      cost: 'FREE'
    };
  }
}

module.exports = new TextToSpeechService();
