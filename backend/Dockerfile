# Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Production stage
FROM node:18-alpine

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

# Copy built node modules and other files
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Set ownership to non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5002/health || exit 1

CMD ["npm", "start"]
