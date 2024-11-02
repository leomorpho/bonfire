# Use a Node.js base image
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all files from local directory to the working directory in the container
COPY . .

# Build the SvelteKit app
RUN npm run build

# Expose the port SvelteKit will run on (e.g., 3000 by default)
EXPOSE 3000

# Start the SvelteKit app
CMD ["npm", "run", "preview"]
