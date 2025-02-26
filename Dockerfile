FROM node:20-alpine AS base
# set aplin source, use tsinghua
RUN sed -i 's/dl-cdn.alpinelinux.org/mirror.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat && apk update

# set yarn source，use taobao
RUN yarn config set registry https://registry.npmmirror.com
# install pnpm
RUN yarn global add pnpm@8.15.5
# set pnpm source，use taobao
RUN pnpm config set registry https://registry.npmmirror.com


# Install dependencies only when needed
FROM base AS deps

# Prisma 二进制engin文件镜像地址 
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma

WORKDIR /app

# for use repackage third part lib
COPY /packages/server/vendor ./packages/server/vendor

# for generate prisma client
COPY /packages/server/prisma/schema.prisma ./packages/server/prisma/schema.prisma

COPY /packages/server/package.json ./packages/server/package.json
COPY package.json pnpm-workspace.yaml yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on the preferred package manager
RUN pnpm -F @crypto-transfer/server install --frozen-lockfile


# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY . .
RUN rm -rf ./packages/server/prisma/seed.ts
# 这个生成的文件/prisma/generated/zod/index.ts，包含未使用变量，所以需要关闭noUnusedLocals
RUN pnpm -F @crypto-transfer/server build:ts --noUnusedLocals false 

# Production image, copy all the files and run next
FROM node:20-alpine 
# set aplin source, use tsinghua
RUN sed -i 's/dl-cdn.alpinelinux.org/mirror.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# set yarn source，use taobao
RUN yarn config set registry https://registry.npmmirror.com
# 全局安装fastify-cli
RUN yarn global add fastify-cli

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

COPY --from=builder --chown=fastify:nodejs /app/package.json ./package.json
COPY --from=builder --chown=fastify:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder --chown=fastify:nodejs /app/packages/server/package.json ./packages/server/package.json
COPY --from=builder --chown=fastify:nodejs /app/packages/server/dist ./packages/server/dist

USER fastify

ENV NODE_ENV=production
ENV FASTIFY_ADDRESS=0.0.0.0
ENV PORT=3000
ENV LOG_LEVEL=info

CMD fastify start -l $LOG_LEVEL -P packages/server/dist/src/app.js