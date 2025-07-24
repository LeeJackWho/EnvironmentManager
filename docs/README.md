# 📚 环境管理器文档中心

欢迎来到环境管理器的文档中心！这里包含了项目的所有技术文档，按功能模块分类整理。

## 📋 文档分类

### 🔧 配置文档 (`config/`)
配置相关的文档，包括系统配置、第三方服务配置等。

- **[Notion 配置指南](config/NOTION_SETUP.md)** - Notion API 和数据库配置详细指南
- **[配置管理](config/CONFIG-MANAGEMENT.md)** - 环境变量和配置文件管理
- **[Midscene 模型配置](config/midscene-model-config.md)** - AI 模型配置和选择指南

### 🎨 前端文档 (`frontend/`)
前端相关的文档，包括 UI 组件、页面结构等。

- 暂无专门的前端文档（前端代码结构相对简单，主要在 `src/app` 和 `src/components` 中）

### ⚙️ 后端文档 (`backend/`)
后端 API、业务逻辑和功能模块相关文档。

- **[登录模式说明](backend/LOGIN-MODES.md)** - 不同登录模式的详细说明和使用场景

### 🚀 部署文档 (`deployment/`)
部署相关的文档，包括 Docker、环境配置等。

- **[Docker 部署指南](deployment/DOCKER_DEPLOYMENT.md)** - 完整的 Docker 部署流程和配置

### 👨‍💻 开发文档 (`development/`)
开发相关的文档，包括项目结构、贡献指南等。

- **[项目结构说明](development/PROJECT-STRUCTURE.md)** - 详细的项目架构和文件组织
- **[贡献指南](development/CONTRIBUTING.md)** - 如何参与项目开发
- **[GitHub 设置](development/GITHUB_SETUP.md)** - GitHub 仓库配置和 CI/CD 设置

## 🚀 快速开始

### 新用户推荐阅读顺序：

1. **[主 README](../README.md)** - 项目概述和快速开始
2. **[Notion 配置指南](config/NOTION_SETUP.md)** - 配置 Notion 集成
3. **[Docker 部署指南](deployment/DOCKER_DEPLOYMENT.md)** - 部署应用
4. **[登录模式说明](backend/LOGIN-MODES.md)** - 了解功能特性

### 开发者推荐阅读顺序：

1. **[项目结构说明](development/PROJECT-STRUCTURE.md)** - 了解代码架构
2. **[贡献指南](development/CONTRIBUTING.md)** - 开发规范和流程
3. **[配置管理](config/CONFIG-MANAGEMENT.md)** - 环境配置
4. **[GitHub 设置](development/GITHUB_SETUP.md)** - 开发环境设置

## 🔍 文档维护

### 文档更新原则
- 所有新功能都应该有对应的文档
- 配置变更需要及时更新相关文档
- 保持文档的准确性和时效性

### 文档分类规则
- **config/** - 配置、设置、环境变量相关
- **frontend/** - UI、组件、前端逻辑相关
- **backend/** - API、业务逻辑、后端功能相关
- **deployment/** - 部署、运维、环境搭建相关
- **development/** - 开发、贡献、项目管理相关

## 📞 获取帮助

如果您在使用过程中遇到问题：

1. 首先查看相关文档
2. 检查 [调试工具页面](/debug) 进行问题排查
3. 查看项目 Issues 或提交新的 Issue

---

📝 **文档贡献**：如果您发现文档有误或需要补充，欢迎提交 Pull Request 或 Issue！
