FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --only=production

# Copy application code
COPY index.js ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
