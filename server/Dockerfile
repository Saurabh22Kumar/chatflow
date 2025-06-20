FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server source code
COPY . .

# Expose the port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
