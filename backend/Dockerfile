FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:20-alpine AS runtime
# Apply latest Alpine security updates in the runtime layer.
RUN apk upgrade --no-cache

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4301

# Create and use an unprivileged runtime user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
RUN chown -R nextjs:nodejs /app
USER nextjs

CMD ["node", "src/server.js"]
