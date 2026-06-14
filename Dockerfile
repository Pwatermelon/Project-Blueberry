FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG DATABASE_URL=postgresql://cvuz:cvuz@127.0.0.1:5432/cvuz
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

ENTRYPOINT ["/docker-entrypoint.sh"]
