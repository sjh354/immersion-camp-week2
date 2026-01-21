# # 개발용
# # 1) build
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# # RUN npm run build

# # 2) runtime
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production

# # Next standalone 쓰면 더 가벼워짐 (선택)
# # next.config.js에 output: 'standalone' 설정 추천
# COPY --from=builder /app ./
# EXPOSE 3000
# CMD ["npm", "run", "dev"]

# 배포용
# 1) 빌드 단계
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 2) 런타임 단계 (standalone 모드 사용)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]