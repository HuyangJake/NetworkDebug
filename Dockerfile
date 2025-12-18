# 多阶段构建：先构建前端，再运行后端
FROM node:18-slim AS builder

# 安装网络工具（用于后端）
RUN apt-get update && apt-get install -y \
    mtr-tiny \
    iputils-ping \
    iputils-ping6 \
    && rm -rf /var/lib/apt/lists/*

# 构建前端
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 运行阶段
FROM node:18-slim

# 安装网络工具
RUN apt-get update && apt-get install -y \
    mtr-tiny \
    iputils-ping \
    iputils-ping6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

# 从前一阶段复制前端构建产物
COPY --from=builder /app/frontend/build ./public

# 修改server.js以提供静态文件服务
# 在server.js末尾添加静态文件服务（如果还没有）

EXPOSE 3001

CMD ["node", "server.js"]
