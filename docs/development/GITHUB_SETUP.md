# 📚 GitHub 推送指南

本指南将帮助您将环境管理系统项目推送到 GitHub，并设置自动部署。

## 🚀 快速推送步骤

### 1️⃣ 初始化 Git 仓库

```bash
# 进入项目目录
cd py/environment-manager

# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件到暂存区
git add .

# 创建初始提交
git commit -m "🎉 Initial commit: 环境管理系统完整版本

✨ 功能特性:
- 🤖 智能自动登录系统（AI + 传统模式）
- 🔄 会话复用与维护
- 🌍 多环境管理（测试/开发/生产）
- 📊 实时状态监控
- 🛠️ 完整调试工具套件
- 🎯 Notion 深度集成

🔧 技术栈:
- Next.js 15 + React 19 + TypeScript
- Playwright 自动化 + Midscene.js AI
- Tailwind CSS + React Icons
- Notion API + Tesseract.js OCR

🚀 部署就绪:
- ✅ 构建成功
- ✅ 零成本部署支持（Vercel/CloudFlare）
- ✅ 完整文档和配置指南"
```

### 2️⃣ 在 GitHub 创建仓库

1. **访问 GitHub**
   - 登录 [GitHub](https://github.com)
   - 点击右上角的 "+" → "New repository"

2. **仓库设置**
   - **Repository name**: `environment-manager` 或 `notion-auto-login-system`
   - **Description**: `🌐 基于 Next.js 和 Notion 的智能化自动登录管理系统`
   - **Visibility**: 
     - 🔒 **Private** (推荐) - 保护敏感配置信息
     - 🌍 **Public** - 开源分享
   - ✅ **Add a README file**: 不勾选（我们已有 README）
   - ✅ **Add .gitignore**: 不勾选（我们已有 .gitignore）
   - ✅ **Choose a license**: 可选择 MIT License

3. **创建仓库**
   - 点击 "Create repository"

### 3️⃣ 连接本地仓库到 GitHub

```bash
# 添加远程仓库（替换为你的仓库 URL）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 设置主分支名称
git branch -M main

# 推送代码到 GitHub
git push -u origin main
```

### 4️⃣ 验证推送成功

1. **检查 GitHub 仓库**
   - 刷新 GitHub 仓库页面
   - 确认所有文件已上传
   - 检查 README.md 是否正确显示

2. **检查文件结构**
   ```
   ✅ README.md - 项目文档
   ✅ NOTION_SETUP.md - Notion 配置指南
   ✅ GITHUB_SETUP.md - 本指南
   ✅ .env.example - 环境变量模板
   ✅ .gitignore - 忽略文件配置
   ✅ package.json - 项目依赖
   ✅ src/ - 源代码目录
   ✅ public/ - 静态资源
   ```

## 🔒 隐私保护检查清单

推送前请确认以下敏感信息已被保护：

- ✅ `.env.local` 文件已被 .gitignore 忽略
- ✅ Notion API 密钥未出现在代码中
- ✅ 数据库 ID 未硬编码
- ✅ 用户密码和敏感数据已排除
- ✅ 浏览器会话数据已忽略
- ✅ 调试截图和日志已忽略

## 🚀 自动部署设置

### Vercel 部署（推荐 - 零成本）

1. **连接 Vercel**
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"

2. **导入仓库**
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - **Project Name**: 保持默认或自定义
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）

4. **环境变量配置**
   - 在 "Environment Variables" 部分添加：
     ```
     NOTION_API_KEY = ntn_your_actual_api_key
     NOTION_DATABASE_ID = your_actual_database_id
     NEXT_PUBLIC_BASE_URL = https://your-app.vercel.app
     ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）

### CloudFlare Pages 部署

1. **连接 CloudFlare**
   - 访问 [CloudFlare Pages](https://pages.cloudflare.com)
   - 连接 GitHub 账号

2. **创建项目**
   - 选择你的仓库
   - 配置构建设置：
     ```
     Build command: npm run build
     Output directory: .next
     Node.js version: 18
     ```

3. **环境变量**
   - 在设置中添加环境变量

## 📝 后续维护

### 日常更新流程

```bash
# 1. 修改代码后提交
git add .
git commit -m "✨ 新功能: 描述你的更改"

# 2. 推送到 GitHub
git push origin main

# 3. 自动部署
# Vercel/CloudFlare 会自动检测推送并重新部署
```

### 版本标签管理

```bash
# 创建版本标签
git tag -a v1.0.0 -m "🎉 Version 1.0.0: 首个稳定版本"

# 推送标签
git push origin v1.0.0

# 查看所有标签
git tag -l
```

### 分支管理

```bash
# 创建开发分支
git checkout -b develop

# 创建功能分支
git checkout -b feature/new-feature

# 合并分支
git checkout main
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

## 🛠️ 常见问题解决

### 推送被拒绝

```bash
# 如果远程仓库有更新，先拉取
git pull origin main --rebase

# 然后再推送
git push origin main
```

### 文件过大

```bash
# 检查大文件
git ls-files --others --ignored --exclude-standard

# 移除大文件并更新 .gitignore
git rm --cached large-file.zip
echo "large-file.zip" >> .gitignore
git commit -m "🗑️ 移除大文件"
```

### 敏感信息泄露

```bash
# 如果意外提交了敏感信息
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch sensitive-file.txt' \
--prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎使用）
git push origin --force --all
```

## 📞 获取帮助

- 📖 [GitHub 官方文档](https://docs.github.com)
- 📖 [Git 官方文档](https://git-scm.com/doc)
- 📖 [Vercel 部署指南](https://vercel.com/docs)
- 📖 [CloudFlare Pages 文档](https://developers.cloudflare.com/pages)

---

🎉 **恭喜！** 你的环境管理系统现在已经成功推送到 GitHub 并可以自动部署了！
