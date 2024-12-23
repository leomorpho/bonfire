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

# Set the environment variable for port 4000
ENV PORT 4000

# Copy the necessary files from the build stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the app on port 4000
EXPOSE 4000

# Start the SvelteKit app in production mode
CMD ["node", "./build"]
