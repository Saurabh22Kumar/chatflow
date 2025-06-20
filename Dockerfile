# ChatFlow - Railway Deployment

# ---- Build Frontend ----
FROM node:18-alpine AS frontend
WORKDIR /app/frontend
COPY public/package*.json ./
RUN npm install
COPY public/ ./
RUN npm run build

# ---- Build Backend ----
FROM node:18-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY server/ ./server/

# Copy built frontend to correct static folder for backend
COPY --from=frontend /app/frontend/build ./public/build

# Expose port (Railway will set $PORT)
EXPOSE $PORT

# Start the backend server
CMD ["node", "server/server.js"]
