# Notion 配置指南

## 📋 概述

本系统使用 Notion 作为数据存储后端，需要正确配置 Notion API 和数据库才能正常使用。

## 🔧 配置步骤

### 1. 创建 Notion Integration

1. 访问 [Notion Developers](https://www.notion.so/my-integrations)
2. 点击 "New integration"
3. 填写基本信息：
   - Name: `环境管理系统`
   - Associated workspace: 选择你的工作区
   - Type: Internal
4. 点击 "Submit" 创建
5. 复制生成的 **Internal Integration Token**（以 `secret_` 开头）

### 2. 创建 Notion 数据库

1. 在 Notion 中创建一个新页面
2. 添加一个数据库（Database）
3. 配置以下字段：

| 字段名 | 类型 | 说明 | 必需 |
|--------|------|------|------|
| Name | Title | 网站名称 | ✅ |
| URL | URL | 网站链接 | ✅ |
| Username | Text | 登录用户名 | ✅ |
| Password | Text | 登录密码 | ✅ |
| Category | Select | 环境分类 | ✅ |
| CaptchaType | Select | 验证码类型 | ✅ |
| Status | Status | 网站状态 | ✅ |
| Description | Text | 备注说明 | ❌ |

### 3. 配置字段选项

#### Category（环境分类）选项：
- 测试
- 开发  
- 生产

#### CaptchaType（验证码类型）选项：
- 无
- 图形
- 滑动

#### Status（网站状态）选项：
- 启用
- 禁用

### 4. 共享数据库给 Integration

1. 在数据库页面点击右上角的 "Share"
2. 点击 "Invite"
3. 搜索并选择你创建的 Integration
4. 确保权限设置为 "Can edit"
5. 点击 "Invite"

### 5. 获取数据库 ID

1. 复制数据库页面的 URL
2. URL 格式：`https://www.notion.so/workspace/数据库ID?v=视图ID`
3. 提取其中的数据库 ID（32位字符串）

### 6. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Notion API 配置
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here

# 验证码服务配置（可选）
CAPTCHA_API_KEY=your_captcha_api_key_here
```

## 🚀 验证配置

1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3000/environments`
3. 如果配置正确，应该能看到：
   - 环境统计卡片
   - 网站列表
   - 添加网站表单的下拉选项

## ❌ 常见问题

### 1. "缺少环境变量配置"
- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确
- 重启开发服务器

### 2. "数据库不存在或无权限访问"
- 确认数据库 ID 正确
- 检查 Integration 是否有数据库访问权限
- 确认数据库已共享给 Integration

### 3. "Notion API 密钥无效"
- 检查 API Key 是否正确复制
- 确认 Integration 状态为 Active
- 重新生成 API Key 并更新配置

### 4. "数据库字段配置错误"
- 确认所有必需字段都已创建
- 检查字段类型是否正确
- 确认选项值与系统要求一致

## 🔒 安全注意事项

1. **不要提交 `.env.local` 文件到版本控制**
2. **定期更换 API Key**
3. **限制 Integration 权限范围**
4. **使用强密码保护 Notion 账户**

## 📞 技术支持

如果遇到问题，请检查：
1. 浏览器开发者工具的控制台错误
2. 网络连接是否正常
3. Notion 服务状态

更多帮助请参考 [Notion API 文档](https://developers.notion.com/)。
