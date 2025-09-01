const Podcast = require('../models/Podcast');
const Document = require('../models/Document');
const textToSpeechService = require('../services/textToSpeech');
const path = require('path');
const fs = require('fs');

// Function to format text for podcast presentation
function formatTextForPodcast(text, contentType) {
  let podcastText = text;

  // Add introduction based on content type
  if (contentType === 'summary') {
    podcastText = `Welcome to this podcast. Today, I'll be presenting a summary of an important document. Here's what you need to know:\n\n${text}\n\nThat concludes our summary. Thank you for listening.`;
  } else {
    podcastText = `Welcome to this podcast. I'll be reading through an important document for you. Let's begin:\n\n${text}\n\nThat concludes our reading. Thank you for listening.`;
  }

  // Clean up the text for better speech synthesis
  podcastText = podcastText
    .replace(/\n\n+/g, '\n\n') // Normalize line breaks
    .replace(/([.!?])\s*\n/g, '$1 ') // Handle sentence endings
    .replace(/([.!?])\s+([A-Z])/g, '$1 $2') // Proper spacing between sentences
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return podcastText;
}

// Enhanced background function to generate audio
async function generatePodcastAudio(podcastId, text, voiceType, voiceSettings) {
  try {
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      console.error(`Podcast not found: ${podcastId}`);
      return;
    }

    console.log(`Starting podcast generation for: ${podcast.title}`);

    // Update progress to 10%
    podcast.progress = 10;
    await podcast.save();

    // Enhance the text for podcast format
    const podcastText = formatTextForPodcast(text, podcast.contentType);

    // Update progress to 25%
    podcast.progress = 25;
    await podcast.save();

    console.log(`Generating audio for podcast: ${podcast.title}`);

    // Generate audio using text-to-speech service
    const audioResult = await textToSpeechService.generateAudio(podcastText, {
      voice: voiceType || 'google-us-english-female',
      settings: voiceSettings || { speed: 1, pitch: 1, volume: 1 }
    });

    if (!audioResult.success) {
      throw new Error(audioResult.error || 'Audio generation failed');
    }

    // Update progress to 75%
    podcast.progress = 75;
    await podcast.save();

    // Handle different types of audio results
    if (audioResult.type === 'browser-tts') {
      // For browser-based TTS, store the instructions
      podcast.status = 'ready_for_browser';
      podcast.progress = 90;
      podcast.audioInstructions = JSON.stringify({
        text: podcastText,
        voice: voiceType,
        settings: voiceSettings,
        type: 'browser-tts'
      });
      podcast.estimatedDuration = audioResult.duration;
      
      console.log(`Podcast ready for browser TTS: ${podcast.title}`);
    } else {
      // For system-based TTS, handle the actual audio file
      const audioFileName = `podcast-${podcastId}-${Date.now()}.${audioResult.filename.split('.').pop()}`;
      const audioPath = path.join(__dirname, '../uploads/podcasts', audioFileName);
      
      // Ensure directory exists
      const dir = path.dirname(audioPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Move the generated file to podcasts directory
      if (fs.existsSync(audioResult.filepath)) {
        fs.copyFileSync(audioResult.filepath, audioPath);
        fs.unlinkSync(audioResult.filepath); // Clean up temp file
      }

      podcast.audioPath = audioPath;
      podcast.audioUrl = `/uploads/podcasts/${audioFileName}`;
      podcast.fileSize = audioResult.fileSize;
      podcast.actualDuration = audioResult.duration;
      
      console.log(`Podcast audio file generated: ${audioFileName}`);
    }

    // Update podcast with final details
    podcast.status = audioResult.type === 'browser-tts' ? 'ready_for_browser' : 'completed';
    podcast.progress = 100;
    podcast.completedAt = new Date();

    await podcast.save();

    console.log(`✅ Podcast generation completed for: ${podcast.title}`);
    return { success: true, podcast };

  } catch (error) {
    console.error('❌ Audio generation error:', error);
    
    try {
      const podcast = await Podcast.findById(podcastId);
      if (podcast) {
        podcast.status = 'failed';
        podcast.errorMessage = error.message;
        podcast.progress = 0;
        await podcast.save();
        console.log(`Podcast marked as failed: ${podcast.title}`);
      }
    } catch (updateError) {
      console.error('Error updating podcast status:', updateError);
    }
    
    return { success: false, error: error.message };
  }
}

// Create podcast from summary
async function createPodcastFromSummary(documentId, userId, options = {}) {
  try {
    // Get the document with summary
    const document = await Document.findOne({
      _id: documentId,
      userId: userId
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.summary || document.summary.trim() === '') {
      throw new Error('Document does not have a summary to convert');
    }

    // Create podcast with enhanced settings for summary content
    const podcastData = {
      userId: userId,
      documentId: documentId,
      title: options.title || `Summary Podcast: ${document.originalName}`,
      description: options.description || `AI-generated podcast from the summary of ${document.originalName}`,
      voiceType: options.voiceType || 'google-us-english-female',
      voiceSettings: options.voiceSettings || { speed: 0.9, pitch: 1, volume: 1 }, // Slightly slower for summaries
      status: 'generating',
      progress: 0,
      wordCount: document.summary.split(/\s+/).length,
      estimatedDuration: Math.ceil(document.summary.split(/\s+/).length / 150), // 150 words per minute
      contentType: 'summary'
    };

    const podcast = new Podcast(podcastData);
    await podcast.save();

    // Start generation in background
    generatePodcastAudio(podcast._id, document.summary, podcastData.voiceType, podcastData.voiceSettings);

    return {
      success: true,
      podcast: {
        id: podcast._id,
        title: podcast.title,
        status: podcast.status,
        progress: podcast.progress,
        estimatedDuration: podcast.estimatedDuration,
        contentType: podcast.contentType
      }
    };

  } catch (error) {
    console.error('Create podcast from summary error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  formatTextForPodcast,
  generatePodcastAudio,
  createPodcastFromSummary
};
