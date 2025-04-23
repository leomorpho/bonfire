# Stage 1: Build the SvelteKit app
FROM node:22 AS build

WORKDIR /app

# Copy dummy env file to set dummy env vars (some are required during build, but they will be overwritten at runtime)
COPY .env.example .env

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm i --frozen-lockfile

# Set the NODE_OPTIONS environment variable to increase memory limit
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Copy app source & build
COPY . .
RUN pnpm run build && \
    pnpm prune --production && \
    rm .env

# Stage 2: Run the SvelteKit app
FROM node:22-alpine AS run

# Set the environment for production
ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

# Copy required files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
# Include migrations
COPY --from=build /app/drizzle ./drizzle

# TODO: is below really needed???
# Ensure @triplit/cli is installed in production
RUN npm install -g @triplit/cli 

# Install PM2 globally
RUN npm install -g pm2

# Expose the app port
EXPOSE 3000

# Run the SvelteKit app using PM2
CMD ["pm2-runtime", "start", "build/index.js", "--name", "bonfire-app", "--instances", "max"]