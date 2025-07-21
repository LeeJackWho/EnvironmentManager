# 环境管理器 MCP 集成指南

## 🎯 概述

本项目已集成 Model Context Protocol (MCP)，允许 AI 助手直接管理环境配置、执行自动登录测试和分析登录页面。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @modelcontextprotocol/sdk
```

### 2. 编译 MCP 服务器

```bash
# 编译 TypeScript 到 JavaScript
npx tsc mcp-server.ts --target es2020 --module commonjs --outDir .
```

### 3. 配置 Claude Desktop

在 Claude Desktop 的配置文件中添加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "environment-manager": {
      "command": "node",
      "args": ["path/to/your/project/mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

### 4. 启动应用

```bash
# 启动环境管理器应用
npm run dev

# 重启 Claude Desktop 以加载 MCP 服务器
```

## 🛠️ 可用工具

### 环境管理
- `list_environments` - 获取所有环境列表
- `list_sites` - 获取网站列表
- `create_site` - 创建新网站配置
- `update_site` - 更新网站配置
- `delete_site` - 删除网站配置

### 自动登录测试
- `test_auto_login` - 测试单个网站自动登录
- `batch_test_sites` - 批量测试多个网站
- `analyze_login_page` - 分析登录页面结构

### 数据分析
- `get_login_history` - 获取登录历史记录
- `optimize_login_strategy` - 优化登录策略

## 💬 使用示例

### 基础操作

```
# 查看所有环境
请列出所有可用的环境

# 查看特定环境的网站
请显示"生产环境"中的所有网站

# 创建新网站
请帮我创建一个新的网站配置：
- 名称：GitHub
- URL：https://github.com/login
- 用户名：myusername
- 密码：mypassword
- 验证码类型：无
```

### 自动登录测试

```
# 测试单个网站
请测试网站ID为"site123"的自动登录功能，使用增强模式

# 批量测试
请批量测试"开发环境"中的所有网站

# 分析登录页面
请分析这个登录页面的结构：https://example.com/login
```

### 智能分析

```
# 获取登录历史
请显示最近50次的登录历史记录

# 优化建议
请分析网站"site123"的登录成功率并提供优化建议

# 失败原因分析
请分析网站"site456"最近的登录失败原因
```

## 🔧 高级配置

### 自定义 API 基础 URL

如果应用运行在不同端口或域名：

```json
{
  "mcpServers": {
    "environment-manager": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "API_BASE_URL": "https://your-domain.com/api"
      }
    }
  }
}
```

### Docker 环境配置

在 Docker 环境中使用：

```json
{
  "mcpServers": {
    "environment-manager": {
      "command": "docker",
      "args": [
        "exec",
        "environment-manager-container",
        "node",
        "/app/mcp-server.js"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

## 🎨 AI 助手使用场景

### 1. 智能环境管理
```
"我需要为新项目设置测试环境，包含以下网站：
- 管理后台：https://admin.example.com
- 用户中心：https://user.example.com  
- API 文档：https://docs.example.com
请帮我批量创建这些配置"
```

### 2. 自动化测试
```
"请每天定时测试生产环境的所有网站登录功能，
如果成功率低于90%，请提供详细的失败分析报告"
```

### 3. 登录问题诊断
```
"网站X的自动登录最近经常失败，
请分析页面结构变化并提供修复建议"
```

### 4. 批量操作
```
"请将开发环境的所有网站配置复制到测试环境，
并批量测试登录功能"
```

## 🔍 故障排除

### MCP 服务器无法启动
1. 检查 Node.js 版本（需要 18+）
2. 确保应用正在运行（localhost:3000）
3. 检查 mcp-server.js 文件是否存在

### API 调用失败
1. 确认 API_BASE_URL 配置正确
2. 检查应用是否正常运行
3. 查看 Claude Desktop 的日志

### 工具调用超时
1. 增加超时时间配置
2. 检查网络连接
3. 确认目标网站可访问

## 📚 扩展开发

### 添加新工具

1. 在 `mcp-server.ts` 中添加工具定义
2. 实现对应的 API 端点
3. 添加工具调用处理逻辑
4. 重新编译和重启

### 自定义分析逻辑

可以扩展 `analyze-page` API 来支持：
- 更复杂的页面结构分析
- 自定义验证码识别
- 特定网站的优化策略

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 MCP 集成功能！
