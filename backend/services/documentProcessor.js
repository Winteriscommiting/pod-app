const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentProcessor {
  constructor() {
    this.supportedTypes = ['pdf', 'docx', 'txt'];
  }

  async processDocument(filePath, fileType) {
    try {
      let extractedText = '';
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          extractedText = await this.processPDF(filePath);
          break;
        case 'docx':
          extractedText = await this.processDocx(filePath);
          break;
        case 'txt':
          extractedText = await this.processTxt(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return {
        text: extractedText.trim(),
        wordCount: this.countWords(extractedText),
        success: true
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        text: '',
        wordCount: 0,
        success: false,
        error: error.message
      };
    }
  }

  async processPDF(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  async processDocx(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async processTxt(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  isValidFileType(fileType) {
    return this.supportedTypes.includes(fileType.toLowerCase());
  }

  getMaxFileSize() {
    return 10 * 1024 * 1024; // 10MB in bytes
  }
}

module.exports = new DocumentProcessor();