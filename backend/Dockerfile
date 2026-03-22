FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose port (adjust if your app uses a different port internally)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
