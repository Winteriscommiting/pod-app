/**
 * Efficient Summarization Service
 * Optimized for speed and reliability with multiple fallback strategies
 */

class EfficientSummarizationService {
    constructor() {
        this.stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        ]);
    }

    /**
     * Main summarization method with multiple strategies
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeText(text, options = {}) {
        const startTime = Date.now();
        
        if (!text || text.trim().length === 0) {
            throw new Error('Text is required for summarization');
        }

        const cleanText = text.trim();
        
        // If text is very short, return as is
        if (cleanText.length < 200) {
            return {
                success: true,
                summary: cleanText,
                originalLength: cleanText.length,
                summaryLength: cleanText.length,
                compressionRatio: 1,
                method: 'too_short',
                processingTime: Date.now() - startTime
            };
        }

        // Choose strategy based on text length
        let result;
        if (cleanText.length < 2000) {
            result = await this.extractiveSummarization(cleanText, options);
        } else {
            result = await this.hybridSummarization(cleanText, options);
        }

        result.processingTime = Date.now() - startTime;
        return result;
    }

    /**
     * Fast extractive summarization for shorter texts
     * @param {string} text - Text to summarize
     * @param {Object} options - Options
     * @returns {Object} Summary result
     */
    async extractiveSummarization(text, options = {}) {
        const sentences = this.splitIntoSentences(text);
        const scored = this.scoreSentences(sentences, text);
        const targetSentences = Math.max(2, Math.min(sentences.length, options.maxSentences || 3));
        
        // Select top scoring sentences
        const topSentences = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, targetSentences)
            .sort((a, b) => a.index - b.index) // Restore original order
            .map(s => s.sentence);

        const summary = topSentences.join(' ');
        
        return {
            success: true,
            summary: summary,
            originalLength: text.length,
            summaryLength: summary.length,
            compressionRatio: Math.round((summary.length / text.length) * 100) / 100,
            method: 'extractive',
            sentencesSelected: targetSentences,
            totalSentences: sentences.length
        };
    }

    /**
     * Hybrid approach for longer texts
     * @param {string} text - Text to summarize
     * @param {Object} options - Options
     * @returns {Object} Summary result
     */
    async hybridSummarization(text, options = {}) {
        // First, create sections from paragraphs
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        if (paragraphs.length === 0) {
            return this.extractiveSummarization(text, options);
        }

        // Summarize each paragraph
        const paragraphSummaries = [];
        for (const paragraph of paragraphs) {
            const sentences = this.splitIntoSentences(paragraph);
            if (sentences.length > 1) {
                const scored = this.scoreSentences(sentences, paragraph);
                const bestSentence = scored.sort((a, b) => b.score - a.score)[0];
                paragraphSummaries.push(bestSentence.sentence);
            } else if (sentences.length === 1) {
                paragraphSummaries.push(sentences[0]);
            }
        }

        // Combine and potentially reduce further
        let combinedSummary = paragraphSummaries.join(' ');
        
        // If still too long, apply extractive summarization to the combined result
        const maxLength = options.maxLength || 500;
        if (combinedSummary.length > maxLength) {
            const result = await this.extractiveSummarization(combinedSummary, {
                ...options,
                maxSentences: Math.max(2, Math.floor(paragraphSummaries.length / 2))
            });
            combinedSummary = result.summary;
        }

        return {
            success: true,
            summary: combinedSummary,
            originalLength: text.length,
            summaryLength: combinedSummary.length,
            compressionRatio: Math.round((combinedSummary.length / text.length) * 100) / 100,
            method: 'hybrid',
            paragraphsProcessed: paragraphs.length,
            finalSentences: paragraphSummaries.length
        };
    }

    /**
     * Split text into sentences
     * @param {string} text - Text to split
     * @returns {Array} Array of sentences
     */
    splitIntoSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10) // Filter out very short fragments
            .map(s => s + '.'); // Add period back
    }

    /**
     * Score sentences based on multiple factors
     * @param {Array} sentences - Array of sentences
     * @param {string} fullText - Full text for context
     * @returns {Array} Array of scored sentences
     */
    scoreSentences(sentences, fullText) {
        const wordFreq = this.calculateWordFrequency(fullText);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

        return sentences.map((sentence, index) => {
            let score = 0;
            const words = this.tokenize(sentence);
            
            // Word frequency score
            const wordScores = words
                .filter(word => !this.stopWords.has(word.toLowerCase()))
                .map(word => wordFreq[word.toLowerCase()] || 0);
            score += wordScores.reduce((sum, s) => sum + s, 0) / words.length;

            // Position score (first and last sentences often important)
            if (index === 0 || index === sentences.length - 1) {
                score += 0.3;
            }

            // Length score (prefer sentences close to average length)
            const lengthDiff = Math.abs(sentence.length - avgSentenceLength);
            score += Math.max(0, 1 - (lengthDiff / avgSentenceLength));

            // Keyword density score
            const keywordDensity = wordScores.filter(s => s > 0).length / words.length;
            score += keywordDensity * 0.5;

            return { sentence, score, index };
        });
    }

    /**
     * Calculate word frequency
     * @param {string} text - Text to analyze
     * @returns {Object} Word frequency map
     */
    calculateWordFrequency(text) {
        const words = this.tokenize(text);
        const freq = {};
        
        words.forEach(word => {
            const lower = word.toLowerCase();
            if (!this.stopWords.has(lower) && lower.length > 2) {
                freq[lower] = (freq[lower] || 0) + 1;
            }
        });

        // Normalize frequencies
        const maxFreq = Math.max(...Object.values(freq));
        Object.keys(freq).forEach(word => {
            freq[word] = freq[word] / maxFreq;
        });

        return freq;
    }

    /**
     * Tokenize text into words
     * @param {string} text - Text to tokenize
     * @returns {Array} Array of words
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    /**
     * Calculate reading time in minutes
     * @param {string} text - Text to analyze
     * @returns {number} Reading time in minutes
     */
    calculateReadingTime(text) {
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = this.tokenize(text).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    /**
     * Get text statistics
     * @param {string} text - Text to analyze
     * @returns {Object} Text statistics
     */
    getTextStats(text) {
        const words = this.tokenize(text);
        const sentences = this.splitIntoSentences(text);
        
        return {
            characterCount: text.length,
            wordCount: words.length,
            sentenceCount: sentences.length,
            averageWordsPerSentence: Math.round(words.length / sentences.length),
            readingTime: this.calculateReadingTime(text)
        };
    }
}

module.exports = EfficientSummarizationService;
