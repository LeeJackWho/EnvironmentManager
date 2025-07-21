# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine AS base

# 安装 Playwright 和 Chromium 依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# 设置 Playwright 环境变量
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用遥测数据收集
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 生产镜像，复制所有文件并运行 Next.js
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 设置 Playwright 环境变量
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建浏览器会话目录
RUN mkdir -p .browser-sessions && \
    chown -R nextjs:nodejs .browser-sessions

COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制环境配置文件（如果存在）
COPY --from=builder --chown=nextjs:nodejs /app/.env.local* ./

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
