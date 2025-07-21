# 📖 Notion 配置指南

本指南将详细介绍如何配置 Notion 集成和数据库，确保环境管理系统能够正常工作。

## 🔧 第一步：创建 Notion 集成

### 1. 访问 Notion 集成页面
打开 [Notion Integrations](https://www.notion.so/my-integrations) 页面

### 2. 创建新集成
1. 点击 **"+ New integration"** 按钮
2. 填写集成信息：
   - **Name**: `Environment Manager`
   - **Associated workspace**: 选择你的工作区
   - **Type**: `Internal`（内部集成）
   - **Capabilities**: 勾选所有权限
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content

### 3. 获取 API 密钥
1. 点击 **"Submit"** 创建集成
2. 复制生成的 **Internal Integration Token**
3. **重要：** 新版本的密钥格式以 `ntn_` 开头（不是 `secret_`）
4. 保存此密钥，稍后需要添加到环境变量中

## 🗄️ 第二步：创建 Notion 数据库

### 1. 创建数据库页面
1. 在 Notion 中创建一个新页面
2. 添加一个数据库（Database）
3. 将数据库命名为 "环境管理" 或其他你喜欢的名称

### 2. 配置数据库字段

**⚠️ 重要提示：字段名称必须完全匹配，区分大小写！**

按照以下表格创建字段：

| 字段名称 | 字段类型 | 必需 | 说明 | 配置选项 |
|---------|---------|------|------|---------|
| **Name** | Title | ✅ | 网站的显示名称 | 默认标题字段 |
| **URL** | URL | ✅ | 网站的完整URL | - |
| **Username** | Text | ✅ | 登录用户名 | - |
| **Password** | Text | ✅ | 登录密码 | - |
| **Category** | Select | ✅ | 环境分类 | 选项：`测试环境`、`生产环境` |
| **CaptchaType** | Select | ✅ | 验证码类型 | 选项：`无`、`图片验证码`、`滑块验证码` |
| **Status** | Status | ✅ | 登录状态 | 选项：`未登录`、`已登录`、`登录失败` |
| **Cookies** | Text | ⚪ | 存储登录后的Cookie | - |
| **Description** | Text | ⚪ | 额外说明信息 | - |

### 3. 详细字段配置步骤

#### 创建 Select 字段（Category）
1. 添加新属性，选择 **Select** 类型
2. 命名为 `Category`
3. 添加选项：
   - `测试环境`
   - `生产环境`

#### 创建 Select 字段（CaptchaType）
1. 添加新属性，选择 **Select** 类型
2. 命名为 `CaptchaType`
3. 添加选项：
   - `无`
   - `图片验证码`
   - `滑块验证码`

#### 创建 Status 字段
1. 添加新属性，选择 **Status** 类型
2. 命名为 `Status`
3. 添加状态选项：
   - `未登录`
   - `已登录`
   - `登录失败`

### 4. 连接集成到数据库

**这是最关键的步骤！**

1. 在数据库页面，点击右上角的 **"..."** 菜单
2. 选择 **"Add connections"** 或 **"连接"**
3. 搜索你刚创建的集成名称（Environment Manager）
4. 点击集成名称将其添加
5. 点击 **"Confirm"** 确认连接

### 5. 获取数据库 ID

1. 复制数据库页面的完整URL
2. URL格式类似：`https://www.notion.so/your-workspace/DATABASE_ID?v=VIEW_ID`
3. 提取其中的 `DATABASE_ID`（32位字符串，不包含连字符）
4. 例如：`231b4483f79680ad9637d4493a485f7c`

## ⚙️ 第三步：配置环境变量

1. 复制 `.env.example` 文件为 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入实际值：

```env
# Notion API 配置
NOTION_API_KEY=ntn_your_actual_api_key_here
NOTION_DATABASE_ID=your_32_character_database_id

# 其他配置
NODE_ENV=development
```

**示例：**
```env
NOTION_API_KEY=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
NOTION_DATABASE_ID=231b4483f79680ad9637d4493a485f7c
```

## 🧪 第四步：测试配置

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问调试工具
打开浏览器访问：[http://localhost:3000/debug](http://localhost:3000/debug)

### 3. 运行连接测试
1. 点击 **"Notion 连接测试"**
2. 点击 **"开始测试"** 按钮
3. 检查测试结果

### 4. 检查数据库结构
1. 点击 **"数据库结构检查"**
2. 点击 **"检查数据库"** 按钮
3. 确认所有字段都正确匹配

## ❌ 常见问题排查

### 问题1：API 密钥无效
**错误信息：** `unauthorized` 或 `API key invalid`

**解决方案：**
- 检查 API 密钥是否以 `ntn_` 开头
- 确认密钥没有多余的空格或换行符
- 重新生成集成密钥

### 问题2：数据库不存在或无权限访问
**错误信息：** `Could not find database` 或 `object_not_found`

**解决方案：**
- 确认数据库 ID 正确（32位字符串）
- 检查集成是否已添加到数据库连接中
- 确认集成有足够的权限

### 问题3：字段配置错误
**错误信息：** `property does not exist` 或字段验证失败

**解决方案：**
- 使用调试工具检查数据库结构
- 确认字段名称完全匹配（区分大小写）
- 检查 Select 和 Status 字段的选项值

## ✅ 配置完成检查清单

- [ ] Notion 集成已创建并获取 API 密钥
- [ ] 数据库已创建并包含所有必需字段
- [ ] 字段名称和类型完全匹配要求
- [ ] 集成已连接到数据库
- [ ] 环境变量已正确配置
- [ ] 连接测试通过
- [ ] 数据库结构检查通过

完成以上所有步骤后，你的环境管理系统就可以正常使用了！

## 🆘 需要帮助？

如果遇到问题，可以：

1. 使用系统内置的调试工具进行诊断
2. 检查浏览器控制台的错误信息
3. 查看服务器日志输出
4. 参考本文档的常见问题部分


