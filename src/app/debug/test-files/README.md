# 🧪 测试和调试文件

这个目录包含所有的测试和调试相关文件，用于开发和维护环境管理器系统。

## 📁 文件分类

### 🤖 验证码测试文件
- `test-captcha-*.js` - 验证码功能测试脚本
- `test-captcha-*.html` - 验证码调试页面
- `test-midscene-*.js` - Midscene.js 集成测试
- `captcha-test-report.json` - 验证码测试报告

### 🔧 配置测试文件
- `check-midscene-models.js` - 检查可用的 AI 模型
- `fix-midscene-config.js` - 修复 Midscene 配置
- `validate-midscene-config.js` - 验证 Midscene 配置
- `test-openrouter-config.js` - OpenRouter API 配置测试

### 🌐 API 测试文件
- `test-api-*.js` - API 接口测试脚本
- `test-sites-api.html` - 网站 API 测试页面
- `test-database-*.html` - 数据库操作测试
- `test-add-*.js` - 添加功能测试

### 📊 功能测试文件
- `test-traditional-*.html` - 传统模式测试页面
- `test-enhanced-*.html` - 增强模式测试页面
- `test-simple.html` - 基础功能测试
- `test-direct-integration.js` - 直接集成测试

## 🚀 使用说明

### HTML 文件
直接在浏览器中打开，用于交互式测试：
```bash
# 在浏览器中打开
open test-captcha-debug.html
```

### JavaScript 文件
通过 Node.js 运行，用于自动化测试：
```bash
# 在项目根目录运行
node src/app/debug/test-files/test-captcha-final.js
```

### 配置文件
用于系统配置和验证：
```bash
# 检查 Midscene 配置
node src/app/debug/test-files/validate-midscene-config.js
```

## 📝 开发规范

### 新增测试文件
1. 所有新的测试和调试文件都应该放在这个目录中
2. 文件命名规范：
   - 测试脚本：`test-[功能名]-[类型].js`
   - 调试页面：`test-[功能名]-[类型].html`
   - 配置文件：`[操作]-[组件]-config.js`

### 文件组织
- 保持文件名的一致性和可读性
- 添加适当的注释和说明
- 定期清理过时的测试文件

## 🔗 相关链接

- [调试工具主页](/debug) - 访问所有调试工具
- [项目文档](../../../README.md) - 主要项目文档
- [配置指南](../../../NOTION_SETUP.md) - Notion 配置指南

---

💡 **提示**：这些文件主要用于开发和调试，不会影响生产环境的运行。
