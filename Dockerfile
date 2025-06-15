# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.10.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

ARG NEXT_PUBLIC_SUPABASE_URL_SECRET_ID="NEXT_PUBLIC_SUPABASE_URL"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY_SECRET_ID="NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# *** NEW: Create .env.local from build secrets ***
# This file will be automatically used by `npx next build`
RUN --mount=type=secret,id=${NEXT_PUBLIC_SUPABASE_URL_SECRET_ID} \
    --mount=type=secret,id=${NEXT_PUBLIC_SUPABASE_ANON_KEY_SECRET_ID} \
    echo "Exporting build secrets..." && \
    export NEXT_PUBLIC_SUPABASE_URL=$(cat /run/secrets/${NEXT_PUBLIC_SUPABASE_URL_SECRET_ID}) && \
    export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(cat /run/secrets/${NEXT_PUBLIC_SUPABASE_ANON_KEY_SECRET_ID}) && \
    npm run build
    # npx next build --experimental-build-mode compile

# Build application
# It will now find and use the variables from the .env.local file.
# RUN npx next build --experimental-build-mode compile

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# The .env.local file from the build stage is NOT copied here, which is secure.
# Runtime secrets are injected by Fly.io automatically.

# Copy built application
COPY --from=build /app/.next/standalone /app
COPY --from=build /app/.next/static /app/.next/static
COPY --from=build /app/public /app/public

# Start the server by default
EXPOSE 3000
CMD [ "node", "server.js" ]