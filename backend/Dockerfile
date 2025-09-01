FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads/documents uploads/podcasts uploads/voices

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
