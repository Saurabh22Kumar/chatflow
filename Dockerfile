# ChatFlow - Railway Deployment (Backend Only)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy pre-built frontend to be served by server
COPY public/build/ ./public/build/

# Expose port
EXPOSE $PORT

# Start the server
CMD ["npm", "start"]
