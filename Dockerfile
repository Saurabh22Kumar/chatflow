# ChatFlow - Railway Production Dockerfile
# This builds both frontend and backend in a single container

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY public/package*.json ./public/
COPY server/package*.json ./server/

# Install dependencies for both frontend and backend
RUN cd public && npm ci --only=production
RUN cd server && npm ci --only=production

# Copy source code
COPY public/ ./public/
COPY server/ ./server/

# Build frontend
WORKDIR /app/public
RUN npm run build

# Switch to server directory
WORKDIR /app/server

# Expose port
EXPOSE 8080

# Start the server (which serves both API and static files)
CMD ["npm", "start"]
