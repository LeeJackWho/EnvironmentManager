# 贡献指南

感谢您对环境管理系统项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能

## 🚀 快速开始

### 开发环境设置

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目到你的账号
   ```

2. **克隆项目**
   ```bash
   git clone https://github.com/your-username/environment-manager.git
   cd environment-manager
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **配置环境**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，配置必要的环境变量
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📋 开发规范

### 代码风格

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码规范
- 使用 Prettier 进行代码格式化
- 组件和函数使用有意义的命名

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**
```bash
git commit -m "feat: 添加环境分类筛选功能"
git commit -m "fix: 修复 Notion API 连接超时问题"
git commit -m "docs: 更新 README 部署指南"
```

### 分支策略

- `main` - 主分支，用于生产环境
- `develop` - 开发分支，用于集成新功能
- `feature/*` - 功能分支，用于开发新功能
- `hotfix/*` - 热修复分支，用于紧急修复

## 🔄 贡献流程

### 1. 创建 Issue

在开始开发之前，请先创建一个 Issue 来描述：
- 要解决的问题
- 要添加的功能
- 改进建议

### 2. 创建分支

```bash
# 从 develop 分支创建新的功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. 开发和测试

```bash
# 开发过程中定期提交
git add .
git commit -m "feat: 添加新功能描述"

# 运行测试确保代码质量
npm run test
npm run lint
```

### 4. 提交 Pull Request

1. 推送分支到你的 Fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. 在 GitHub 上创建 Pull Request
3. 填写 PR 模板，详细描述变更内容
4. 等待代码审查和反馈

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行 ESLint 检查
npm run lint

# 运行类型检查
npm run type-check

# 修复 ESLint 问题
npm run lint:fix
```

### 测试覆盖率

我们要求新功能必须包含相应的测试，并保持合理的测试覆盖率。

## 📝 文档贡献

### 文档类型

- **README.md** - 项目主要文档
- **NOTION_SETUP.md** - Notion 配置指南
- **API 文档** - API 接口说明
- **代码注释** - 关键函数和组件的注释

### 文档规范

- 使用清晰的标题结构
- 提供代码示例
- 包含截图说明（如适用）
- 保持文档与代码同步更新

## 🐛 Bug 报告

### Bug 报告模板

请使用以下模板报告 Bug：

```markdown
## Bug 描述
简要描述遇到的问题

## 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
描述你期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 96, Safari 15]
- Node.js: [e.g. 18.0.0]
- 项目版本: [e.g. 1.0.0]

## 附加信息
添加任何其他有助于解决问题的信息
```

## 💡 功能建议

### 功能建议模板

```markdown
## 功能描述
简要描述建议的功能

## 问题背景
描述这个功能要解决的问题

## 解决方案
描述你建议的解决方案

## 替代方案
描述你考虑过的其他解决方案

## 附加信息
添加任何其他相关信息或截图
```

## 🏆 贡献者认可

我们会在以下地方认可贡献者：
- README.md 中的贡献者列表
- 发布说明中的感谢
- GitHub Contributors 页面

## 📞 联系方式

如果你有任何问题或需要帮助：

- 📧 邮箱：[your-email@example.com]
- 💬 GitHub Discussions
- 🐛 GitHub Issues

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🎉
