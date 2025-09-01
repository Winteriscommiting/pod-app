const axios = require('axios');

class SummarizationService {
    constructor() {
        // Using Hugging Face's free inference API
        this.baseURL = 'https://api-inference.huggingface.co/models';
        this.models = {
            // Free summarization models
            primary: 'facebook/bart-large-cnn',
            fallback: 'sshleifer/distilbart-cnn-12-6',
            alternative: 'google/pegasus-xsum'
        };
        
        // No API key required for basic inference API usage (rate limited but free)
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Split text into chunks for summarization
     * @param {string} text - Text to split
     * @param {number} maxChunkSize - Maximum size per chunk
     * @returns {Array} Array of text chunks
     */
    splitTextIntoChunks(text, maxChunkSize = 1000) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk + '.');
                }
                currentChunk = trimmedSentence;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk + '.');
        }

        return chunks.length > 0 ? chunks : [text.substring(0, maxChunkSize)];
    }

    /**
     * Summarize text using Hugging Face model
     * @param {string} text - Text to summarize
     * @param {string} model - Model to use
     * @param {Object} options - Summarization options
     * @returns {Promise<string>} Summarized text
     */
    async summarizeWithModel(text, model, options = {}) {
        try {
            const payload = {
                inputs: text,
                parameters: {
                    max_length: options.maxLength || 150,
                    min_length: options.minLength || 40,
                    do_sample: false,
                    ...options.parameters
                }
            };

            const response = await axios.post(
                `${this.baseURL}/${model}`,
                payload,
                { 
                    headers: this.headers,
                    timeout: 30000 // 30 second timeout
                }
            );

            if (response.data && Array.isArray(response.data) && response.data[0]) {
                return response.data[0].summary_text || response.data[0].generated_text;
            }

            throw new Error('Invalid response format from API');
        } catch (error) {
            if (error.response?.status === 503) {
                throw new Error('Model is loading, please try again in a few minutes');
            }
            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded, please try again later');
            }
            throw new Error(`Summarization failed: ${error.message}`);
        }
    }

    /**
     * Summarize text with fallback models
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeText(text, options = {}) {
        if (!text || text.trim().length === 0) {
            throw new Error('Text is required for summarization');
        }

        const cleanText = text.trim();
        
        // If text is very short, return as is
        if (cleanText.length < 100) {
            return {
                success: true,
                summary: cleanText,
                originalLength: cleanText.length,
                summaryLength: cleanText.length,
                compressionRatio: 1,
                model: 'none',
                method: 'too_short'
            };
        }

        const chunks = this.splitTextIntoChunks(cleanText, 1000);
        const summaries = [];
        let usedModel = '';

        // Try each model with fallback
        const modelNames = [this.models.primary, this.models.fallback, this.models.alternative];
        
        for (const chunk of chunks) {
            let chunkSummary = null;
            let lastError = null;

            for (const modelName of modelNames) {
                try {
                    console.log(`Attempting summarization with model: ${modelName}`);
                    chunkSummary = await this.summarizeWithModel(chunk, modelName, options);
                    usedModel = modelName;
                    break;
                } catch (error) {
                    console.warn(`Model ${modelName} failed:`, error.message);
                    lastError = error;
                    
                    // Wait before trying next model
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (!chunkSummary) {
                // If all models fail, create extractive summary
                console.log('All models failed, creating extractive summary');
                chunkSummary = this.createExtractiveSummary(chunk, options);
                usedModel = 'extractive_fallback';
            }

            summaries.push(chunkSummary);
        }

        // Combine summaries if multiple chunks
        let finalSummary = summaries.join(' ');
        
        // If combined summary is still too long, summarize it again
        if (finalSummary.length > 500 && summaries.length > 1) {
            try {
                finalSummary = await this.summarizeWithModel(finalSummary, this.models.primary, {
                    maxLength: 200,
                    minLength: 50
                });
                usedModel += ' + final_pass';
            } catch (error) {
                console.warn('Final summarization pass failed:', error.message);
                // Keep the combined summary
            }
        }

        return {
            success: true,
            summary: finalSummary,
            originalLength: cleanText.length,
            summaryLength: finalSummary.length,
            compressionRatio: Math.round((finalSummary.length / cleanText.length) * 100) / 100,
            model: usedModel,
            method: 'ai_summarization',
            chunksProcessed: chunks.length
        };
    }

    /**
     * Create extractive summary as fallback
     * @param {string} text - Text to summarize
     * @param {Object} options - Options
     * @returns {string} Extractive summary
     */
    createExtractiveSummary(text, options = {}) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const targetLength = options.maxLength || 150;
        
        // Simple extractive approach: take first few sentences up to target length
        let summary = '';
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (summary.length + trimmedSentence.length + 1 <= targetLength) {
                summary += (summary ? '. ' : '') + trimmedSentence;
            } else {
                break;
            }
        }
        
        return summary + (summary.endsWith('.') ? '' : '.');
    }

    /**
     * Generate keywords from text
     * @param {string} text - Text to extract keywords from
     * @returns {Array} Array of keywords
     */
    extractKeywords(text) {
        // Simple keyword extraction
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);

        // Count word frequency
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // Get top keywords
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Analyze document content
     * @param {string} text - Document text
     * @returns {Object} Analysis results
     */
    async analyzeDocument(text) {
        try {
            const summary = await this.summarizeText(text);
            const keywords = this.extractKeywords(text);
            
            // Estimate reading time (average 200 words per minute)
            const wordCount = text.split(/\s+/).length;
            const readingTimeMinutes = Math.ceil(wordCount / 200);

            return {
                success: true,
                summary: summary.summary,
                keywords,
                wordCount,
                characterCount: text.length,
                readingTimeMinutes,
                compressionRatio: summary.compressionRatio,
                model: summary.model,
                analysisDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Document analysis failed:', error);
            return {
                success: false,
                error: error.message,
                summary: this.createExtractiveSummary(text),
                keywords: this.extractKeywords(text),
                wordCount: text.split(/\s+/).length,
                characterCount: text.length,
                readingTimeMinutes: Math.ceil(text.split(/\s+/).length / 200)
            };
        }
    }
}

module.exports = new SummarizationService();
