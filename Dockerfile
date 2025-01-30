# Stage 1: Build the SvelteKit app
FROM node:22 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm i --frozen-lockfile

# Copy app source & build
COPY . .
COPY .env.example .env
RUN npx @sveltejs/kit sync
RUN pnpm run build

# Prune devDependencies to reduce image size
RUN pnpm prune --production

# 🧹 Remove the .env file before shipping the runtime container
RUN rm -f .env

# Stage 2: Run the SvelteKit app
FROM node:22-slim AS run

# Set the environment for production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy required files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/node_modules ./node_modules

# Ensure PNPM is installed
RUN npm install -g pnpm

# Expose the app port
EXPOSE 3000

# Run the SvelteKit app
ENTRYPOINT ["pnpm", "run", "start"]
