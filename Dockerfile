# Stage 1: Build the SvelteKit app
FROM node:18 AS builder

WORKDIR /app

# Install pnpm and dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy and build the app
COPY . .
RUN pnpm build

# Stage 2: Create the final, minimal image
FROM node:18-slim AS runner

WORKDIR /app

# Copy the built app from the previous stage
COPY --from=builder /app/build ./build

# Install a lightweight HTTP server (e.g., serve) to serve static files
RUN npm install -g serve

# Expose the app on port 4000
EXPOSE 4000

# Start the server
CMD ["serve", "-s", "build", "-l", "4000"]
