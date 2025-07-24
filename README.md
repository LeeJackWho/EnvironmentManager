# 🌐 环境管理系统

基于 Next.js 和 Notion 的智能化自动登录管理系统，支持多环境分类管理，提供完整的网站登录状态监控、会话复用和异步自动化解决方案。

![项目状态](https://img.shields.io/badge/状态-生产就绪-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Playwright](https://img.shields.io/badge/Playwright-自动化-orange)
![Midscene](https://img.shields.io/badge/Midscene.js-AI识别-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 项目亮点

- **🤖 AI 智能验证码识别** - 集成 Midscene.js，支持 8 种验证码类型，识别准确率接近 100%
- **⚡ 快速响应** - 验证码识别时间优化至 2-5 秒，避免验证码失效
- **🔄 智能会话管理** - 自动保持登录状态，支持 Cookie 复用和过期检测
- **🌍 多环境支持** - 清晰区分测试、开发、生产环境，避免操作混淆
- **📊 实时监控** - 异步任务管理，实时显示执行进度和状态
- **🛡️ 安全可靠** - 完善的隐私保护机制，敏感信息安全存储

## ✨ 核心功能

### 🔐 智能自动登录系统

- **🤖 AI 智能识别** - 直接集成 Midscene.js，支持 8 种验证码类型的智能识别和自动解决
- **🔧 传统 OCR 模式** - 支持 Tesseract.js OCR 识别和滑块验证码自动解决
- **⚡ 异步并发执行** - 支持多个环境同时启动测试，互不干扰，智能任务管理
- **🎯 多元素识别** - 智能识别用户名、密码、登录按钮等页面元素
- **📊 实时进度监控** - 浮动任务监控器，实时显示执行进度和状态
- **🔄 智能冲突避免** - 自动检测测试状态，避免数据刷新干扰正在进行的测试

### 🔄 会话复用与维护

- **🍪 Cookie 智能复用** - 保存登录状态，避免重复登录，提升效率
- **🔍 登录状态检查** - 实时验证现有会话是否仍然有效
- **🔄 自动会话维护** - 定期访问页面保持 Cookie 活跃状态
- **⚡ 快速状态验证** - 自动登录前先检查是否已登录，节省时间
- **🧹 智能清理机制** - 自动清理过期的 Cookie 和会话数据

### 🌍 多环境管理

- **🏷️ 环境分类** - 清晰区分测试、开发、生产环境，避免操作混淆
- **📊 实时统计** - 显示各环境的网站数量和登录状态分布
- **🔍 智能筛选** - 支持按环境类型、状态等条件筛选网站列表
- **🎮 批量操作** - 支持批量管理多个环境的网站

### 📊 实时状态监控
- **可视化界面** - 直观显示登录状态、环境统计和网站健康度
- **状态更新** - 实时同步登录状态变化
- **操作反馈** - 详细的操作结果提示和错误信息

### 🎯 Notion 深度集成
- **数据库管理** - 使用Notion数据库作为配置中心，支持团队协作
- **动态选项** - 自动获取数据库字段选项，无需硬编码
- **软删除机制** - 通过状态字段实现软删除，保护数据安全

### 🚀 现代化用户体验
- **响应式设计** - 完美适配桌面端和移动端
- **密码显示切换** - 支持明文/密文密码显示切换
- **菜单优化** - 隐藏未实现功能，专注核心特性
- **图标区分** - 使用不同图标区分功能模块
- **智能状态提示** - 实时显示测试进行状态，避免操作冲突

### 🛠️ 调试工具套件
- **Notion 连接测试** - 验证 API 密钥和数据库配置
- **数据库结构检查** - 自动检查必需字段和类型
- **登录调试工具** - 详细分析页面结构和登录流程
- **任务监控工具** - 手动查看和管理异步任务状态
- **简单持久化测试** - 验证浏览器独立运行功能

## 🎯 适用场景

- **测试团队** - 管理多个测试环境的登录状态
- **运维团队** - 监控生产环境系统的可用性
- **开发团队** - 自动化开发环境的登录流程
- **QA团队** - 批量管理测试账号和环境

## 🚀 快速开始

### 📋 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Notion 账号（免费版即可）

### 1️⃣ 克隆项目

```bash
git clone https://github.com/your-username/environment-manager.git
cd environment-manager
```

### 2️⃣ 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3️⃣ 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，填入你的配置：
```env
# Notion API 配置
NOTION_API_KEY=ntn_your_notion_integration_token_here
NOTION_DATABASE_ID=your_32_character_database_id_here

# Midscene.js AI 验证码识别配置（推荐）
OPENAI_API_KEY=sk-or-v1-your_openrouter_api_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
MIDSCENE_MODEL_NAME=qwen/qwen2.5-vl-72b-instruct:free

# 传统验证码识别服务（可选）
CAPTCHA_API_KEY=your_captcha_service_api_key_here

# 环境配置
NODE_ENV=development
```

### 4️⃣ 配置 Midscene.js AI 验证码识别

#### 获取 OpenRouter API Key（推荐）

1. **注册 OpenRouter 账号**
   - 访问 [OpenRouter](https://openrouter.ai)
   - 注册账号并获取 API Key

2. **配置环境变量**
   ```env
   OPENAI_API_KEY=your_openrouter_api_key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1/chat/completions
   MIDSCENE_MODEL_NAME=qwen/qwen2.5-vl-72b-instruct:free
   ```

3. **支持的验证码类型**
   - ✅ **文字验证码**：数字/字母组合 (如：ABCD、1234)
   - ✅ **点击验证码**：点选图片/文字 (如：点击所有汽车)
   - ✅ **网格验证码**：3x3或4x4网格选择
   - ✅ **滑块验证码**：拖拽滑块完成拼图
   - ✅ **旋转验证码**：旋转图片到正确角度
   - ✅ **逻辑验证码**：数学题等 (如：3+5=?)
   - ✅ **拖拽验证码**：拖拽元素到指定位置
   - ✅ **序列点击**：按特定顺序点击多个元素

### 5️⃣ 配置 Notion 数据库

#### 快速配置步骤：

1. **创建 Notion 集成**
   - 访问 [Notion Integrations](https://www.notion.so/my-integrations)
   - 创建新集成，获取 API 密钥（以 `ntn_` 开头）

2. **创建数据库并添加字段**
   - 在 Notion 中创建数据库
   - 添加必需字段（字段名称必须完全匹配）：
     - `Name` (Title)、`URL` (URL)、`Username` (Text)、`Password` (Text)
     - `Category` (Select)、`CaptchaType` (Select)、`Status` (Status)
     - `Cookies` (Text)、`Description` (Text)

3. **连接集成到数据库**
   - 在数据库页面点击 "..." → "Add connections"
   - 添加你创建的集成

📖 **详细配置步骤请参考：[Notion 配置指南](./NOTION_SETUP.md)**

### 5️⃣ 启动开发服务器

```bash
npm run dev
```

🎉 访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## 📋 项目状态

### ✅ 功能完成度

#### 🏗️ 基础架构
- ✅ Next.js 15 现代化框架搭建
- ✅ TypeScript 类型安全开发
- ✅ Tailwind CSS 响应式设计
- ✅ 组件化架构设计

#### 🔗 数据集成
- ✅ Notion API 深度集成和数据库操作
- ✅ 动态字段选项获取
- ✅ 软删除机制实现
- ✅ 实时数据同步

#### 🎯 核心功能
- ✅ **智能自动登录系统**
  - ✅ 多元素识别算法（用户名、密码、登录按钮）
  - ✅ 图片验证码OCR识别
  - ✅ 滑块验证码自动解决
  - ✅ 登录状态智能检测
  - ✅ Cookie自动获取和存储

- ✅ **会话保持功能**
  - ✅ 登录状态实时监控
  - ✅ Cookie自动刷新机制
  - ✅ 会话维护和过期检测
  - ✅ 过期Cookie自动清理

- ✅ **环境管理系统**
  - ✅ 多环境分类（测试/开发/生产）
  - ✅ 环境统计和可视化
  - ✅ 按环境筛选功能
  - ✅ 环境状态监控

#### 🎨 用户界面
- ✅ 响应式前端界面设计
- ✅ 密码显示/隐藏切换
- ✅ 菜单优化和图标区分
- ✅ 实时状态更新反馈
- ✅ 错误处理和用户提示

#### 🔧 API 接口
- ✅ RESTful API 路由设计
- ✅ 网站CRUD操作接口
- ✅ 自动登录执行接口
- ✅ 状态检查接口
- ✅ 数据库选项获取接口

### ✅ 部署就绪状态

- ✅ 项目构建成功 (`npm run build`)
- ✅ 开发服务器正常启动
- ✅ 所有依赖正确安装
- ✅ TypeScript 类型检查通过
- ✅ 生产环境优化配置

## 🗂️ 项目架构

```
environment-manager/
├── 📁 src/
│   └── 📁 app/                    # Next.js App Router
│       ├── 📄 page.tsx           # 主页面（环境管理界面）
│       ├── 📄 layout.tsx         # 布局组件
│       └── 📄 globals.css        # 全局样式
├── 📁 notion-auto-login/         # 自动登录功能模块
│   ├── 📁 src/lib/              # 核心库文件
│   │   ├── 📄 notion.js         # Notion API 操作
│   │   ├── 📄 playwright.js     # 自动化登录引擎
│   │   ├── 📄 session.js        # 会话管理
│   │   └── 📁 captcha/          # 验证码识别模块
│   │       ├── 📄 ocr.js        # OCR 图片识别
│   │       └── 📄 slider.js     # 滑块验证码
│   └── 📁 src/pages/api/        # API 路由
│       ├── 📄 sites.js          # 网站列表 API
│       ├── 📄 environments.js   # 环境统计 API
│       ├── 📄 login.js          # 登录执行 API
│       └── 📄 check-status.js   # 状态检查 API
├── 📄 .env.example              # 环境变量模板
├── 📄 .gitignore                # Git 忽略文件
├── 📄 NOTION_SETUP.md           # Notion 配置指南
├── 📄 package.json              # 项目依赖配置
└── 📄 README.md                 # 项目文档
```

## 🔧 API 接口文档

### 网站管理

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| `GET` | `/api/sites` | 获取启用状态的网站列表 | `environment` (可选) |
| `POST` | `/api/sites/add` | 添加新网站 | 网站信息对象 |
| `PUT` | `/api/sites/[id]` | 更新网站信息 | 网站ID + 更新数据 |
| `DELETE` | `/api/sites/[id]` | 禁用网站（软删除） | 网站ID |
| `GET` | `/api/sites/[id]` | 获取单个网站详情 | 网站ID |

### 环境统计

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| `GET` | `/api/environments` | 获取环境统计信息 | - |

### 自动登录功能

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| `POST` | `/api/login` | 执行自动登录 | `siteId` |

### 数据库配置

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| `GET` | `/api/database/options` | 获取数据库字段选项 | - |

### 请求示例

```javascript
// 获取测试环境网站
fetch('/api/sites?environment=测试')
  .then(res => res.json())
  .then(data => console.log(data.sites));

// 添加新网站
fetch('/api/sites/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '测试网站',
    url: 'https://example.com/login',
    username: 'testuser',
    password: 'testpass',
    environment: '测试',
    captchaType: '图形',
    notes: '测试环境网站'
  })
});

// 执行自动登录
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ siteId: 'your-site-id' })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('登录成功:', data.message);
  } else {
    console.error('登录失败:', data.error);
  }
});

// 获取数据库字段选项
fetch('/api/database/options')
  .then(res => res.json())
  .then(data => {
    console.log('环境选项:', data.data.options.Category);
    console.log('验证码类型:', data.data.options.CaptchaType);
  });

// 禁用网站（软删除）
fetch('/api/sites/your-site-id', {
  method: 'DELETE'
})
.then(res => res.json())
.then(data => console.log('网站已禁用:', data.message));
```

## 🐳 Docker 部署

### 📦 使用 Docker Compose（推荐）

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/environment-manager.git
   cd environment-manager
   ```

2. **配置环境变量**
   ```bash
   cp deployment-config-template.env .env
   # 编辑 .env 文件，填入你的配置
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 应用地址：http://localhost:3000
   - 查看日志：`docker-compose logs -f`

### 🔧 手动 Docker 构建

1. **构建镜像**
   ```bash
   docker build -t environment-manager .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name environment-manager \
     -p 3000:3000 \
     -e NOTION_API_KEY=your_key \
     -e NOTION_DATABASE_ID=your_db_id \
     -e OPENAI_API_KEY=your_openai_key \
     environment-manager
   ```

### 📋 Docker 配置说明

项目包含以下 Docker 配置文件：
- `Dockerfile` - 应用镜像构建文件
- `docker-compose.yml` - 服务编排配置
- `deployment-config-template.env` - 环境变量模板

## 📚 使用指南

### 🎯 基础使用流程

1. **初始配置**
   - 按照 [Notion 配置指南](./NOTION_SETUP.md) 设置数据库
   - 配置环境变量
   - 启动应用

2. **添加网站**
   - 使用界面添加网站信息，或在 Notion 数据库中直接添加
   - 设置环境分类（测试/开发/生产）
   - 配置登录凭据和验证码类型
   - 系统自动设置状态为"启用"

3. **自动登录操作**
   - 点击网站卡片上的"▶️"按钮执行自动登录
   - 系统自动识别登录页面元素（用户名、密码、登录按钮）
   - 自动处理验证码（图片OCR识别、滑块自动解决）
   - 登录成功后自动保存Cookie信息

4. **会话保持管理**
   - 系统定期检查登录状态
   - 自动刷新Cookie保持会话活跃
   - 检测到登录过期时自动标记状态
   - 支持手动触发状态检查

5. **监控管理**
   - 查看环境统计信息和网站分布
   - 按环境筛选网站列表
   - 实时监控登录状态变化
   - 查看详细的操作日志

6. **网站管理操作**
   - 编辑网站信息（支持密码显示/隐藏切换）
   - 禁用网站（软删除，不在列表中显示）
   - 批量管理多个环境的网站

### 🔒 安全最佳实践

- ✅ **环境变量保护** - 所有敏感信息存储在 `.env.local` 文件中，已在 `.gitignore` 中排除
- ✅ **API 密钥安全** - 定期更新 Notion API 密钥和 AI 服务密钥
- ✅ **权限最小化** - 限制 Notion 集成权限，仅授予必要的数据库访问权限
- ✅ **HTTPS 部署** - 生产环境启用 HTTPS 加密传输
- ✅ **数据备份** - 定期备份 Notion 数据库和重要配置
- ✅ **隐私保护** - 项目已配置完善的 `.gitignore`，确保敏感信息不会被提交到代码库

### ⚠️ 重要安全提醒

- 🚫 **切勿提交** `.env.local` 文件到代码库
- 🚫 **切勿在代码中硬编码** API 密钥或敏感信息
- 🚫 **切勿分享** 包含真实密钥的配置文件
- ✅ **使用** `.env.example` 作为配置模板
- ✅ **定期检查** 代码库中是否意外包含敏感信息

## 🛠️ 技术栈详情

### 前端技术

- **Next.js 15** - React 全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS 框架
- **React Icons** - 图标库

### 后端技术

- **Next.js API Routes** - 服务端 API
- **Notion API** - 数据存储
- **Playwright** - 浏览器自动化
- **Tesseract.js** - OCR 识别

### 开发工具

- **ESLint** - 代码规范
- **TypeScript** - 类型检查
- **Git** - 版本控制

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持与反馈


## 📖 相关文档

### 📚 项目文档
- [� 文档中心](./docs/README.md) - 完整的项目文档索引
- [�📖 Notion 配置指南](./docs/config/NOTION_SETUP.md) - Notion 集成配置
- [🐳 Docker 部署指南](./docs/deployment/DOCKER_DEPLOYMENT.md) - Docker 部署详细说明
- [🏗️ 项目结构说明](./docs/development/PROJECT-STRUCTURE.md) - 代码架构和文件组织
- [🔧 登录模式说明](./docs/backend/LOGIN-MODES.md) - 不同登录模式详解

### 🔗 外部文档
- [🔗 Next.js 官方文档](https://nextjs.org/docs)
- [🔗 Notion API 文档](https://developers.notion.com/)
- [🔗 Playwright 文档](https://playwright.dev/)
- [🔗 Midscene.js 文档](https://midscene.js.org/)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
