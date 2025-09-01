const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎤 Podcast App - FREE TTS Configuration Setup\n');

async function setupConfiguration() {
  console.log('This will help you configure FREE Text-to-Speech options for your podcast app.\n');
  
  // Check if .env exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    const overwrite = await askQuestion('Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. You can manually edit your .env file.');
      process.exit(0);
    }
  }

  console.log('\n🆓 Choose a FREE TTS Option:');
  console.log('1. Browser Web Speech API (100% Free - Client-side)');
  console.log('2. Local eSpeak-NG (100% Free - Server-side)');
  console.log('3. Local Festival TTS (100% Free - Server-side)');
  console.log('4. Local Pico TTS (100% Free - Lightweight)');
  console.log('5. All Free Options (Recommended)');
  
  const choice = await askQuestion('\nEnter your choice (1-5): ');
  
  let envContent = `# Podcast App Environment Configuration - FREE VERSION
# Generated on ${new Date().toISOString()}
# 🆓 100% FREE & OPEN SOURCE - No API keys required!

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/podcast-app

# JWT Configuration
JWT_SECRET=dev-secret-key-please-change-in-production-make-it-very-long
JWT_EXPIRES_IN=7d

# Client Configuration
CLIENT_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Security Configuration
BCRYPT_ROUNDS=12

`;

  switch (choice) {
    case '1':
      envContent += `# FREE TTS Configuration - Browser Web Speech API
TTS_PROVIDER=browser
TTS_FALLBACK=espeak
ENABLE_BROWSER_TTS=true

# Browser TTS Settings
DEFAULT_VOICE=en-US
SPEECH_RATE=1.0
SPEECH_PITCH=1.0
SPEECH_VOLUME=1.0
`;
      console.log('✅ Browser Web Speech API configured (Client-side TTS)');
      console.log('💡 This uses the browser\'s built-in TTS engine');
      break;
      
    case '2':
      console.log('\n🔊 eSpeak-NG Setup:');
      console.log('Installing eSpeak-NG...');
      
      envContent += `# FREE TTS Configuration - eSpeak-NG
TTS_PROVIDER=espeak
TTS_FALLBACK=browser
ENABLE_ESPEAK=true

# eSpeak Settings
ESPEAK_VOICE=en
ESPEAK_SPEED=175
ESPEAK_PITCH=50
ESPEAK_AMPLITUDE=100
`;
      
      await installEspeak();
      console.log('✅ eSpeak-NG configured');
      break;
      
    case '3':
      console.log('\n🎭 Festival TTS Setup:');
      
      envContent += `# FREE TTS Configuration - Festival TTS
TTS_PROVIDER=festival
TTS_FALLBACK=browser
ENABLE_FESTIVAL=true

# Festival Settings
FESTIVAL_VOICE=voice_kal_diphone
FESTIVAL_AUDIO_METHOD=esdaudio
`;
      
      await installFestival();
      console.log('✅ Festival TTS configured');
      break;
      
    case '4':
      console.log('\n🔊 Pico TTS Setup:');
      
      envContent += `# FREE TTS Configuration - Pico TTS
TTS_PROVIDER=pico
TTS_FALLBACK=browser
ENABLE_PICO=true

# Pico Settings
PICO_VOICE=en-US
PICO_SPEED=1.0
`;
      
      await installPico();
      console.log('✅ Pico TTS configured');
      break;
      
    case '5':
      envContent += `# FREE TTS Configuration - ALL OPTIONS ENABLED
TTS_PROVIDER=browser
TTS_FALLBACK=espeak
ENABLE_BROWSER_TTS=true
ENABLE_ESPEAK=true
ENABLE_FESTIVAL=true
ENABLE_PICO=true

# Browser TTS Settings
DEFAULT_VOICE=en-US
SPEECH_RATE=1.0
SPEECH_PITCH=1.0
SPEECH_VOLUME=1.0

# eSpeak Settings
ESPEAK_VOICE=en
ESPEAK_SPEED=175
ESPEAK_PITCH=50

# Festival Settings
FESTIVAL_VOICE=voice_kal_diphone

# Pico Settings
PICO_VOICE=en-US
PICO_SPEED=1.0
`;
      
      console.log('Installing all free TTS engines...');
      await installAllFreeTTS();
      console.log('✅ All free TTS options configured');
      break;
      
    default:
      console.log('Invalid choice. Using browser TTS only.');
      envContent += `# FREE TTS Configuration - Browser Only
TTS_PROVIDER=browser
ENABLE_BROWSER_TTS=true
DEFAULT_VOICE=en-US
`;
  }

  // Add additional free configuration
  envContent += `
# Audio Configuration
AUDIO_FORMAT=mp3
AUDIO_QUALITY=128
AUDIO_SAMPLE_RATE=22050

# Free Voice Options
FREE_VOICES_ENABLED=true
VOICE_CLONING_ENABLED=false

# Development Settings
DEBUG_TTS=true
LOG_AUDIO_GENERATION=true
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ FREE TTS Configuration saved to .env file');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:5000');
  console.log('3. Test the FREE voice functionality');
  console.log('4. All TTS features work without any API keys!');
  
  console.log('\n🆓 FREE Features Available:');
  console.log('• Browser-based text-to-speech');
  console.log('• Multiple free voice engines');
  console.log('• No usage limits or costs');
  console.log('• No API keys required');
  console.log('• Complete offline functionality');
  
  rl.close();
}

async function installEspeak() {
  console.log('📦 Installing eSpeak-NG...');
  console.log('💡 On Windows: Download from http://espeak.sourceforge.net/download.html');
  console.log('💡 On Linux: sudo apt install espeak-ng');
  console.log('💡 On macOS: brew install espeak');
  
  const proceed = await askQuestion('Press Enter when eSpeak is installed (or skip): ');
  return true;
}

async function installFestival() {
  console.log('📦 Installing Festival TTS...');
  console.log('💡 On Windows: Download from http://www.cstr.ed.ac.uk/projects/festival/');
  console.log('💡 On Linux: sudo apt install festival');
  console.log('💡 On macOS: brew install festival');
  
  const proceed = await askQuestion('Press Enter when Festival is installed (or skip): ');
  return true;
}

async function installPico() {
  console.log('📦 Installing Pico TTS...');
  console.log('💡 On Linux: sudo apt install libttspico-utils');
  console.log('💡 On Windows/macOS: Will use browser fallback');
  
  const proceed = await askQuestion('Press Enter when Pico is installed (or skip): ');
  return true;
}

async function installAllFreeTTS() {
  await installEspeak();
  await installFestival();
  await installPico();
  
  console.log('\n🎉 All free TTS engines installation guidance provided!');
  console.log('💡 Browser TTS will work immediately without any installation');
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

setupConfiguration().catch(console.error);
