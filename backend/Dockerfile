FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:20-alpine AS runtime
# Apply latest Alpine security updates in the runtime layer.
RUN apk upgrade --no-cache

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4301

# npm/npx are not needed at runtime; removing them shrinks attack surface
# and avoids CI vulnerability noise from npm's bundled transitive packages.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Create and use an unprivileged runtime user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
RUN chown -R nextjs:nodejs /app
USER nextjs

CMD ["node", "src/server.js"]
