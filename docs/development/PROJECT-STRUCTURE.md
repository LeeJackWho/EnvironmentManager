# 📁 项目结构说明

## 🏗️ 整体架构

```
environment-manager/
├── 📁 src/                          # 源代码目录
│   ├── 📁 app/                      # Next.js App Router 页面
│   │   ├── 📁 api/                  # API 路由
│   │   │   ├── 📁 config/           # 配置管理 API
│   │   │   ├── 📁 environments/     # 环境管理 API
│   │   │   ├── 📁 tasks/            # 异步任务 API
│   │   │   └── 📁 check-status/     # 状态检查 API
│   │   ├── 📁 environments/         # 环境管理页面
│   │   ├── 📁 config/               # 配置管理页面
│   │   └── layout.tsx               # 全局布局
│   ├── 📁 components/               # React 组件
│   │   ├── Sidebar.tsx              # 侧边栏导航
│   │   └── TaskMonitor.tsx          # 任务监控组件
│   ├── 📁 lib/                      # 核心库文件
│   │   ├── session-manager.ts       # 统一会话管理
│   │   ├── task-manager.ts          # 异步任务管理
│   │   ├── playwright-login.ts      # 自动登录核心
│   │   ├── notion-client.ts         # Notion API 客户端
│   │   └── midscene-direct.ts       # Midscene.js 直接集成
│   └── 📁 types/                    # TypeScript 类型定义
│       ├── config.ts                # 配置类型
│       └── index.ts                 # 通用类型
├── 📁 public/                       # 静态资源
├── 📁 scripts/                      # 项目维护脚本
├── 📁 src/app/debug/test-files/     # 测试和调试文件
├── 📄 配置文件
│   ├── package.json                 # 项目依赖
│   ├── next.config.ts               # Next.js 配置
│   ├── tailwind.config.ts           # Tailwind CSS 配置
│   ├── tsconfig.json                # TypeScript 配置
│   └── .env.local                   # 环境变量（需创建）
├── 🧪 测试和调试工具
│   ├── test-add-site.js             # 网站添加功能测试
│   ├── test-api.js                  # API 功能完整测试
│   ├── test-simple.html             # 简单测试页面
│   └── test-add-api.html            # API 测试工具页面
└── 📚 文档
    ├── README.md                    # 项目主文档
    ├── QUICK-START.md               # 快速开始指南
    ├── PROJECT-STRUCTURE.md         # 项目结构说明（本文档）
    ├── NOTION_SETUP.md              # Notion 配置指南
    ├── CONFIG-MANAGEMENT.md         # 配置管理说明
    └── LOGIN-MODES.md               # 登录模式说明
```

## 🔧 核心模块说明

### **1. 会话管理 (session-manager.ts)**
```typescript
// 统一的会话管理器，负责：
- 🔍 检查登录状态
- 🍪 Cookie 复用和刷新
- 🔄 会话维护
- ⚡ 快速状态验证
```

### **2. 任务管理 (task-manager.ts)**
```typescript
// 异步任务管理器，支持：
- 📋 创建和跟踪任务
- 🔄 并发控制（最多5个全局，2个单站点）
- 📊 实时状态更新
- 🧹 自动清理过期任务
```

### **3. 自动登录 (playwright-login.ts)**
```typescript
// 核心登录逻辑，包含：
- 🎯 元素识别和填写
- 🤖 验证码处理（OCR + AI）
- 📊 登录状态检测
- 🍪 Cookie 获取和保存
```

### **4. 配置管理 (config.ts)**
```typescript
// 统一配置系统，支持：
- 📝 Notion API 配置
- 🤖 Midscene.js AI 配置
- 🔧 验证码服务配置
- ⚙️ 应用基础配置
```

## 🎮 功能模块

### **环境管理**
- **页面**: `/src/app/environments/page.tsx`
- **API**: `/src/app/api/environments/`
- **功能**: 网站管理、异步登录测试、状态监控

### **配置管理**
- **页面**: `/src/app/config/page.tsx`
- **API**: `/src/app/api/config/`
- **功能**: 系统配置、API 密钥管理、实时验证

### **任务监控**
- **组件**: `/src/components/TaskMonitor.tsx`
- **API**: `/src/app/api/tasks/`
- **功能**: 实时任务状态、进度监控、任务控制

## 🔄 数据流

```
用户操作 → 前端组件 → API 路由 → 核心库 → Notion/浏览器 → 结果返回
```

### **登录流程**
1. **状态检查** - 先检查现有 Cookie 是否有效
2. **会话复用** - 如果有效，直接使用现有会话
3. **自动登录** - 如果无效，启动自动登录流程
4. **状态保存** - 保存新的登录状态和 Cookie

### **异步任务流程**
1. **任务创建** - 创建异步任务记录
2. **并发控制** - 检查并发限制
3. **后台执行** - 在独立浏览器中执行
4. **状态更新** - 实时更新任务进度
5. **结果保存** - 保存执行结果

## 🧪 测试和调试工具

### **内置调试工具**
- **调试工具页面**: `/debug` - 完整的调试工具集合
- **Notion 连接测试**: `/debug/test-notion` - 验证 Notion API 配置
- **数据库结构检查**: `/debug/database` - 检查数据库字段配置
- **登录调试工具**: `/debug/login-debug` - 详细的登录过程分析

### **独立测试文件**
- **test-simple.html**: 简单的网页测试工具，无需命令行
- **test-add-api.html**: 完整的 API 测试工具，带可视化界面
- **test-api.js**: Node.js 脚本，用于批量 API 测试
- **test-add-site.js**: 专门测试网站添加功能的脚本

### **使用测试工具**
```bash
# 1. 启动应用
npm run dev

# 2. 使用网页测试工具
# 访问 http://localhost:3000/test-simple.html
# 访问 http://localhost:3000/test-add-api.html

# 3. 使用命令行测试
node test-api.js
node test-add-site.js

# 4. 使用内置调试工具
# 访问 http://localhost:3000/debug
```

## 🛠️ 开发指南

### **添加新功能**
1. 在 `/src/types/` 中定义类型
2. 在 `/src/lib/` 中实现核心逻辑
3. 在 `/src/app/api/` 中创建 API 路由
4. 在 `/src/app/` 或 `/src/components/` 中创建界面

### **配置新服务**
1. 在 `/src/types/config.ts` 中添加配置项
2. 在配置管理页面中添加表单字段
3. 在验证 API 中添加验证逻辑
4. 在核心库中使用配置

### **调试和测试**
- **优先使用内置调试工具**: 访问 `/debug` 页面
- **使用网页测试工具**: 打开 `test-simple.html` 或 `test-add-api.html`
- **命令行测试**: 运行 `test-api.js` 进行批量测试
- **浏览器开发者工具**: 查看网络请求和控制台日志
- **服务器日志**: 查看终端输出的详细日志
- **Notion 数据库**: 直接在 Notion 中查看数据变化
- **任务监控器**: 使用右下角浮动按钮监控异步任务

## 📋 维护清单

### **定期维护**
- [ ] 清理过期的任务记录
- [ ] 更新 Notion API 密钥
- [ ] 检查依赖包更新
- [ ] 备份重要配置

### **性能优化**
- [ ] 监控并发任务数量
- [ ] 优化 Cookie 存储大小
- [ ] 清理无用的会话数据
- [ ] 监控内存使用情况

### **安全检查**
- [ ] 验证 API 密钥权限
- [ ] 检查敏感信息泄露
- [ ] 更新安全依赖
- [ ] 审查访问日志
