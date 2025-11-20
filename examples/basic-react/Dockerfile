# RAuth SDK - Basic React Example Dockerfile
# Multi-stage build for production-ready container

# Stage 1: Build the SDK and example app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy SDK package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY src ./src

# Install SDK dependencies and build
RUN npm ci
RUN npm run build

# Stage 2: Build the example app
FROM node:20-alpine AS example-builder

# Set working directory for example
WORKDIR /example

# Copy built SDK from previous stage
COPY --from=builder /app /sdk

# Copy example files
COPY examples/basic-react/package*.json ./
COPY examples/basic-react/tsconfig.json ./
COPY examples/basic-react/vite.config.ts ./
COPY examples/basic-react/index.html ./
COPY examples/basic-react/src ./src

# Install dependencies (this will use the local SDK via file:../../)
RUN npm install --legacy-peer-deps

# Build the example app
RUN npm run build

# Stage 3: Serve the built app with nginx
FROM nginx:alpine AS production

# Create default nginx configuration for SPA
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } location /health { access_log off; return 200 "healthy\n"; add_header Content-Type text/plain; } }' > /etc/nginx/conf.d/default.conf

# Copy built files from example builder
COPY --from=example-builder /example/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
