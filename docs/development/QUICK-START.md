# 🚀 快速开始指南

## ⚡ 5分钟快速部署

### **1️⃣ 环境准备**
```bash
# 检查 Node.js 版本（需要 18.0+）
node --version

# 检查 npm 版本
npm --version
```

### **2️⃣ 项目安装**
```bash
# 克隆项目
git clone <your-repository-url>
cd environment-manager

# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

### **3️⃣ 环境配置**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
nano .env.local
```

**最小配置示例：**
```env
# Notion 配置（必需）
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 应用配置
PORT=3000
NODE_ENV=development
```

### **4️⃣ 启动应用**
```bash
# 开发模式启动
npm run dev

# 生产模式启动
npm run build && npm start
```

### **5️⃣ 访问应用**
- 🌐 **主页**: http://localhost:3000
- ⚙️ **配置管理**: http://localhost:3000/config
- 🌍 **环境管理**: http://localhost:3000/environments

## 🎯 核心功能使用

### **配置系统**
1. **访问配置管理** → http://localhost:3000/config
2. **配置 Notion API** → 输入 API Key 和数据库 ID
3. **配置 Midscene.js**（可选）→ 输入 API Key 启用 AI 识别
4. **测试连接** → 点击验证按钮确认配置正确

### **环境管理**
1. **添加网站** → 点击"添加网站"按钮
2. **填写信息** → 网站名称、URL、登录凭据
3. **选择环境** → 测试环境/生产环境
4. **启动测试** → 选择登录模式（AI智能/传统OCR）

### **异步任务监控**
1. **启动任务** → 点击"启动测试"选择模式
2. **监控进度** → 右下角浮动按钮显示运行状态
3. **查看详情** → 点击任务查看详细执行信息
4. **管理任务** → 支持取消运行中的任务

## 🔧 常见问题解决

### **Q: Notion 连接失败**
```bash
# 检查 API Key 格式
echo $NOTION_API_KEY | grep "secret_"

# 检查数据库权限
# 确保 Integration 有数据库访问权限
```

### **Q: 浏览器启动失败**
```bash
# 重新安装 Playwright
npx playwright install --force chromium

# 检查系统依赖
npx playwright install-deps
```

### **Q: 端口被占用**
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 修改端口
echo "PORT=3001" >> .env.local
```

### **Q: 验证码识别失败**
1. **检查 Midscene 配置** → 确认 API Key 有效
2. **尝试传统模式** → 使用 OCR 识别
3. **手动处理** → 在浏览器中手动完成验证码

## 📊 监控和维护

### **日志查看**
```bash
# 查看应用日志
npm run dev 2>&1 | tee app.log

# 查看错误日志
grep "ERROR" app.log
```

### **性能监控**
- **任务数量** → 避免超过5个并发任务
- **内存使用** → 定期重启长时间运行的实例
- **Cookie 大小** → 定期清理过期 Cookie

### **数据备份**
```bash
# 导出 Notion 数据库
# 在 Notion 中使用"导出"功能

# 备份配置文件
cp .env.local .env.backup
```

## 🚀 部署到生产环境

### **Docker 部署**
```bash
# 构建镜像
docker build -t environment-manager .

# 运行容器
docker run -d \
  --name env-manager \
  -p 3000:3000 \
  --env-file .env.local \
  environment-manager
```

### **Vercel 部署**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### **传统服务器部署**
```bash
# 构建生产版本
npm run build

# 使用 PM2 管理进程
npm install -g pm2
pm2 start npm --name "env-manager" -- start
pm2 save
pm2 startup
```

## 🔒 安全配置

### **生产环境安全**
```env
# 使用强密码
NOTION_API_KEY=secret_强密码字符串

# 启用 HTTPS
HTTPS=true
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/key.pem

# 限制访问
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

### **权限控制**
- ✅ Notion Integration 最小权限原则
- ✅ 定期轮换 API 密钥
- ✅ 使用环境变量存储敏感信息
- ✅ 启用访问日志记录

## 📞 获取帮助

### **文档资源**
- 📖 [项目结构说明](./PROJECT-STRUCTURE.md)
- ⚙️ [配置管理指南](./CONFIG-MANAGEMENT.md)
- 🔐 [登录模式说明](./LOGIN-MODES.md)
- 🔗 [Notion 配置指南](./NOTION_SETUP.md)

### **故障排除**
1. **查看控制台日志** → 检查错误信息
2. **检查网络连接** → 确认 API 可访问
3. **验证配置** → 使用配置管理页面测试
4. **重启服务** → 清理缓存和临时文件

---

🎉 **恭喜！您已成功部署环境管理系统！**

现在可以开始管理您的多环境登录状态了。如有问题，请查看详细文档或检查日志信息。
