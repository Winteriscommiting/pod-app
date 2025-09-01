const textToSpeechService = require('./services/textToSpeech');
require('dotenv').config();

async function testTTSService() {
  console.log('🎤 Testing Text-to-Speech Service...\n');

  try {
    // Test getting available voices
    console.log('📋 Getting available voices...');
    const voices = await textToSpeechService.getAvailableVoices();
    console.log(`✅ Found ${voices.length} voices:`);
    voices.forEach(voice => {
      console.log(`   - ${voice.name} (${voice.id}) - ${voice.gender}, ${voice.language}`);
    });

    // Test audio generation if provider is configured
    if (textToSpeechService.provider) {
      console.log('\n🎵 Testing audio generation...');
      const testText = 'Hello! This is a test of the text-to-speech service.';
      const result = await textToSpeechService.generateAudio(testText, {
        voice: voices[0].id,
        settings: { speed: 1.0 }
      });

      if (result.success) {
        console.log('✅ Audio generation successful!');
        console.log(`   - File: ${result.filename}`);
        console.log(`   - Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
        console.log(`   - Duration: ${result.duration} seconds`);
        console.log(`   - Voice: ${result.voice}`);
      } else {
        console.log('❌ Audio generation failed');
      }
    } else {
      console.log('\n⚠️  No TTS provider configured');
      console.log('Please set up API keys in your .env file:');
      console.log('   - OPENAI_API_KEY for OpenAI TTS');
      console.log('   - ELEVENLABS_API_KEY for ElevenLabs');
      console.log('   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for AWS Polly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTTSService();
