# 网络调试工具

一个基于React和Node.js的网络调试工具，提供端口扫描、DNS解析、Ping、MTR和HTTP/HTTPS测试等功能。

## 功能特性

- 🏠 **首页展示**：自动检测并显示当前设备的IPv4和IPv6地址，支持手动刷新和重试机制
- 🔍 **端口扫描**：支持IPv4和IPv6，常用端口和自定义端口扫描，显示端口状态和响应情况
- 🌐 **DNS解析**：解析域名的各种DNS记录（A、AAAA、MX、NS、TXT、CNAME等）
- 📡 **Ping测试**：网络连通性和延迟测试，支持IPv4和IPv6地址及域名
- 🛣️ **MTR诊断**：网络路径追踪和诊断，结合ping和traceroute功能
- 🌐 **HTTP/HTTPS测试**：测试HTTP/HTTPS协议连接，检查服务可访问性，支持自动诊断
- 📝 **历史记录**：所有功能都支持输入历史记录，方便快速重复使用
- 🔄 **智能重试**：公网IP检测支持多服务重试机制，提高成功率

## 技术栈

### 前端
- React 18
- React Router
- Material-UI (MUI)
- Axios

### 后端
- Node.js
- Express
- 原生Node.js模块（net、dns、child_process）

## 快速开始

### 前置要求
- Node.js >= 14
- npm 或 yarn
- mtr工具（仅MTR功能需要，可选）

### 安装依赖

```bash
npm run install-all
```

### 运行项目

开发模式（同时启动前端和后端）：

```bash
npm run dev
```

或者分别启动：

```bash
# 启动后端（端口3001）
npm run server

# 启动前端（端口3000）
npm run client
```

### 访问应用

打开浏览器访问：http://localhost:3000

## 项目结构

```
NetworkDebug/
├── backend/           # 后端API服务
│   ├── server.js     # Express服务器（包含静态文件服务）
│   └── package.json
├── frontend/         # React前端应用
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   ├── components/ # 公共组件
│   │   └── App.js
│   └── package.json
├── Dockerfile        # Docker构建文件（多阶段构建）
├── fly.toml         # Fly.io配置文件
├── .dockerignore    # Docker忽略文件
└── package.json      # 根package.json
```

## API接口

### GET /api/ip-addresses
获取本机IP地址（支持IPv4和IPv6）

### POST /api/port-scan
端口扫描
```json
{
  "host": "192.168.1.1",
  "ports": [80, 443, 8080],
  "timeout": 3000
}
```

### POST /api/dns-resolve
DNS解析
```json
{
  "hostname": "example.com"
}
```

### POST /api/ping
Ping测试（自动支持IPv4和IPv6）
```json
{
  "host": "8.8.8.8",
  "count": 4
}
```

### POST /api/mtr
MTR诊断
```json
{
  "host": "8.8.8.8",
  "count": 10
}
```

### POST /api/http-test
HTTP/HTTPS连接测试
```json
{
  "url": "https://example.com",
  "method": "GET",
  "timeout": 10000,
  "followRedirects": true,
  "autoDiagnose": true
}
```

## 核心功能说明

### IPv6支持
- **Ping功能**：自动检测IPv6域名和地址，使用`ping6`命令（Unix/Linux/macOS）或`ping -6`（Windows）
- **DNS解析**：支持AAAA记录查询，显示IPv6地址
- **端口扫描**：支持IPv6地址和域名
- **公网IP检测**：支持IPv4和IPv6地址检测，使用多个服务源提高成功率

### 历史记录功能
所有功能的输入框都支持历史记录：
- 自动保存成功执行的输入
- 最多保存20条历史记录
- 支持快速选择和删除
- 各功能历史记录相互独立（使用不同的localStorage键）

### 智能重试机制
- 公网IP检测支持多服务源和重试机制
- 超时时间增加到15秒
- 每个服务最多重试3次
- 失败时提供备用服务链接

### HTTP测试诊断
- 自动诊断连接失败原因
- DNS解析检查
- 网络连通性测试（Ping）
- 端口扫描
- 提供问题分析和建议措施

## 一键部署

### 使用Fly.io部署（推荐⭐⭐⭐）

**优势**：
- ✅ 前后端一起部署，开箱即用
- ✅ 完整支持IPv6（自动分配IPv6地址）
- ✅ 支持执行系统命令（ping、ping6、mtr）
- ✅ 免费额度充足（每月160GB小时）
- ✅ 全球边缘部署，速度快
- ✅ 自动HTTPS证书

#### 部署步骤

1. **安装Fly.io CLI**
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# 或使用Homebrew (macOS)
brew install flyctl
```

2. **登录Fly.io**
```bash
flyctl auth login
```

3. **修改fly.toml配置**（可选）
```toml
app = "your-app-name"  # 修改为你的应用名称
primary_region = "sin"  # 选择区域: sin(新加坡), hkg(香港), nrt(东京), iad(美国东部)
```

4. **一键部署**
```bash
flyctl launch
```

按照提示操作：
- 输入应用名称（或使用自动生成的）
- 选择区域（建议选择离用户最近的）
- 是否设置PostgreSQL（选择No）
- 是否立即部署（选择Yes）

5. **查看部署状态**
```bash
flyctl status
flyctl open  # 在浏览器中打开应用
```

#### 常用命令

```bash
# 更新部署
flyctl deploy

# 查看日志
flyctl logs

# 查看应用状态
flyctl status

# 查看IPv6地址
flyctl ips list

# 打开应用
flyctl open

# 查看应用信息
flyctl info
```

### 使用Railway部署（备选方案⭐⭐）

1. 访问 [Railway](https://railway.app/)
2. 使用GitHub账号登录
3. 创建新项目，选择"Deploy from GitHub repo"
4. 选择你的仓库
5. Railway会自动检测Dockerfile并部署
6. 等待部署完成，Railway会提供访问URL

**注意**：Railway需要确保Dockerfile在项目根目录，并且可能需要手动配置端口。

## 本地构建和测试

### 使用Docker本地测试

```bash
# 构建镜像
docker build -t network-debug .

# 运行容器
docker run -p 3001:3001 network-debug

# 访问应用
open http://localhost:3001
```

### 手动构建

```bash
# 构建前端
cd frontend
npm install
npm run build

# 运行后端（会自动提供前端静态文件）
cd ../backend
npm install --production
# 将前端build目录复制到backend/public
cp -r ../frontend/build ./public
node server.js
```

访问：http://localhost:3001

## 注意事项

1. **MTR功能**：需要系统安装mtr工具
   - macOS: `brew install mtr`
   - Linux: `apt-get install mtr-tiny` 或 `yum install mtr`
   - Docker镜像已包含mtr工具

2. **端口扫描**：扫描大量端口可能需要较长时间，建议合理设置超时时间

3. **权限要求**：某些网络操作可能需要管理员权限

4. **IPv6支持**：确保系统支持IPv6网络，ping6命令需要系统支持

5. **公网IP检测**：如果多次尝试无法获取IP，可以访问 [北京市IPv6发展平台](https://www.bj-ipv6.com/z/) 自行确认

6. **部署环境**：部署到生产环境时，确保后端支持IPv6和系统命令执行

## 部署检查清单

- [ ] 应用部署成功
- [ ] 前端页面正常显示
- [ ] API接口正常响应
- [ ] 支持IPv6（测试ping IPv6地址，如 `ping6 2001:4860:4860::8888`）
- [ ] 系统命令可用（ping、ping6、mtr）
- [ ] 测试所有功能是否正常
- [ ] 测试IPv6相关功能（ping IPv6域名、DNS AAAA记录等）
- [ ] HTTPS证书正常（Fly.io自动配置）

## 常见问题

### Q: 部署后无法访问？
A: 检查以下几点：
- 确认部署成功（`flyctl status`）
- 检查防火墙设置
- 确认端口配置正确（默认3001）

### Q: IPv6功能不工作？
A: 确保：
- 部署平台支持IPv6（Fly.io自动支持）
- 系统命令可用（Docker镜像已包含）
- 测试IPv6地址格式正确

### Q: MTR功能报错？
A: 确保：
- 系统已安装mtr工具（Docker镜像已包含）
- 有执行权限

### Q: 如何更新部署？
A: 使用 `flyctl deploy` 命令，会自动构建并部署最新代码

## 许可证

MIT
