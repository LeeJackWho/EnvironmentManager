# Docker 部署指南

本文档介绍如何使用 Docker 部署环境管理器应用。

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd environment-manager
```

### 2. 配置环境变量

复制环境变量模板：

```bash
cp .env.docker.example .env.local
```

编辑 `.env.local` 文件，填写必要的配置：

```bash
# Notion API 配置 (必需)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 其他可选配置...
```

### 3. 部署应用

#### Linux/macOS

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 完整部署
./deploy.sh

# 或者分步执行
./deploy.sh --build    # 仅构建镜像
./deploy.sh --start    # 仅启动服务
```

#### Windows (PowerShell)

```powershell
# 完整部署
.\deploy.ps1

# 或者分步执行
.\deploy.ps1 -Build    # 仅构建镜像
.\deploy.ps1 -Start    # 仅启动服务
```

### 4. 访问应用

部署完成后，访问以下地址：

- 🌐 **主应用**: http://localhost:3000
- 🏥 **健康检查**: http://localhost:3000/api/health
- 🐛 **调试工具**: http://localhost:3000/debug

## 📦 手动部署

如果不使用部署脚本，可以手动执行以下命令：

### 构建镜像

```bash
docker-compose build --no-cache
```

### 启动服务

```bash
docker-compose up -d
```

### 查看状态

```bash
docker-compose ps
```

### 查看日志

```bash
docker-compose logs -f
```

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `NOTION_API_KEY` | ✅ | Notion API 密钥 | `secret_xxx...` |
| `NOTION_DATABASE_ID` | ✅ | Notion 数据库 ID | `xxx...` |
| `CAPTCHA_API_KEY` | ❌ | 验证码服务 API 密钥 | `xxx...` |
| `PORT` | ❌ | 应用端口 | `3000` |
| `NODE_ENV` | ❌ | Node.js 环境 | `production` |

### Docker Compose 配置

主要配置项：

- **端口映射**: `3000:3000`
- **内存限制**: 2GB
- **CPU 限制**: 1.0 核心
- **健康检查**: 30秒间隔
- **重启策略**: `unless-stopped`

### 数据持久化

- **浏览器会话**: Docker volume `browser-sessions`
- **日志文件**: 本地目录 `./logs`
- **配置文件**: 本地目录 `./config` (只读)

## 🛠️ 管理命令

### 查看服务状态

```bash
docker-compose ps
```

### 查看实时日志

```bash
docker-compose logs -f
```

### 重启服务

```bash
docker-compose restart
```

### 停止服务

```bash
docker-compose down
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 清理资源

```bash
# 使用脚本清理
./deploy.sh --cleanup

# 或手动清理
docker-compose down
docker image prune -f
docker volume prune -f
```

## 🐛 故障排除

### 常见问题

#### 1. 容器启动失败

**症状**: 容器无法启动或立即退出

**解决方案**:
```bash
# 查看详细日志
docker-compose logs

# 检查配置文件
cat .env.local

# 重新构建镜像
docker-compose build --no-cache
```

#### 2. 健康检查失败

**症状**: 健康检查返回 503 错误

**解决方案**:
```bash
# 检查 Notion API 配置
curl http://localhost:3000/api/health

# 查看应用日志
docker-compose logs environment-manager
```

#### 3. 浏览器自动化失败

**症状**: Playwright 无法启动浏览器

**解决方案**:
```bash
# 检查容器内 Chromium
docker-compose exec environment-manager which chromium-browser

# 查看 Playwright 日志
docker-compose logs environment-manager | grep -i playwright
```

#### 4. 内存不足

**症状**: 容器被 OOM Killer 终止

**解决方案**:
```yaml
# 在 docker-compose.yml 中增加内存限制
deploy:
  resources:
    limits:
      memory: 4G  # 增加到 4GB
```

### 调试模式

启用调试模式：

```bash
# 设置环境变量
echo "LOG_LEVEL=debug" >> .env.local

# 重启服务
docker-compose restart
```

### 性能监控

查看资源使用情况：

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
docker system df
```

## 🔒 安全建议

### 1. 环境变量安全

- 不要将 `.env.local` 提交到版本控制
- 使用强密码和安全的 API 密钥
- 定期轮换 API 密钥

### 2. 网络安全

- 使用反向代理 (Nginx/Apache)
- 启用 HTTPS
- 配置防火墙规则

### 3. 容器安全

- 定期更新基础镜像
- 使用非 root 用户运行
- 启用安全选项

## 📈 生产部署建议

### 1. 使用反向代理

```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 配置 HTTPS

```bash
# 使用 Let's Encrypt
certbot --nginx -d your-domain.com
```

### 3. 监控和日志

- 配置日志轮转
- 设置监控告警
- 使用日志聚合工具

### 4. 备份策略

```bash
# 备份 Docker volumes
docker run --rm -v browser-sessions:/data -v $(pwd):/backup alpine tar czf /backup/browser-sessions-backup.tar.gz -C /data .

# 备份配置文件
tar czf config-backup.tar.gz .env.local docker-compose.yml
```

## 📞 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue 并附上详细日志

---

**注意**: 本应用包含浏览器自动化功能，请确保在合规的环境中使用。
