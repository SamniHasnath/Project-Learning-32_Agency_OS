# Agency OS API — NestJS + Prisma
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# prisma.config.ts requires DATABASE_URL to load; generate never connects, so a placeholder is fine.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && npx nest build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
# Prisma CLI (for `migrate deploy`) and ts-node (for the optional seed) are kept,
# so the image can migrate its own database on start.
COPY --from=build /app ./
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
