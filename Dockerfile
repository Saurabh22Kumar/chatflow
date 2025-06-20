# ChatFlow - Railway Deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy frontend source and build it
COPY public/ ./public/
WORKDIR /app/public
RUN npm ci && npm run build

# Copy server source
WORKDIR /app
COPY server/ ./server/

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
