FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for docker caching)
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start command (can be overridden in docker-compose for dev mode)
CMD ["npm", "run", "dev"]
