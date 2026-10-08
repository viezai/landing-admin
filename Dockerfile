FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build client SPA assets into dist/client
RUN npm run build

# Remove development dependencies for smaller image footprint
RUN npm prune --production

# Create volume mount point for persistent SQLite data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/contacts.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["npm", "start"]
