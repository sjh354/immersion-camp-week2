# 1) build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next standalone 쓰면 더 가벼워짐 (선택)
# next.config.js에 output: 'standalone' 설정 추천
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
