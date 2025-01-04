# Stage 1: Build the SvelteKit app
FROM node:22 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application source code and build the app
COPY . .
RUN npx @sveltejs/kit sync
RUN pnpm build

# Prune devDependencies
RUN pnpm prune --production

# Stage 2: Run the SvelteKit app
FROM node:22 AS run

# Set the environment for production
ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

# Copy build artifacts and necessary files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public

# Increase core dump size if needed (optional, for debugging purposes)
RUN ulimit -c unlimited

# Expose the app port
EXPOSE 3000

# Run the SvelteKit app
ENTRYPOINT ["node", "build"]
