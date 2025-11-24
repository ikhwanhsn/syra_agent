FROM node:18

WORKDIR /app

# Copy package files first (better cache)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the project
COPY . .

# Build TypeScript
RUN npm run build

# The API will run using compiled JS
CMD ["node", "dist/index.js"]

# Internal port (CHANGE if your index listens on another port)
EXPOSE 4000