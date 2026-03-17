FROM node:18-alpine
 
WORKDIR /app
 
# Copy package files
COPY package*.json ./
 
# Install ALL dependencies (including dev for build)
RUN npm ci
 
# Copy prisma schema
COPY prisma ./prisma/
 
# Generate Prisma Client
RUN npx prisma generate
 
# Copy source code
COPY . .
 
# Build TypeScript
RUN npm run build
 
# Prune dev dependencies
RUN npm prune --production
 
# Expose port
EXPOSE 3001
 
# Start the server
CMD ["npm", "start"]
 