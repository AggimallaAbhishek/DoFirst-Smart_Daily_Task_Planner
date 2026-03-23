FROM node:20-alpine

WORKDIR /app

# Install only production dependencies for runtime image.
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4301

# Use the non-root node user provided by the base image.
USER node

CMD ["node", "src/server.js"]
