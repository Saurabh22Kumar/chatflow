# ChatFlow - Railway Deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-built frontend and server source
COPY public/build/ ./public/build/
COPY server/ ./server/

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
