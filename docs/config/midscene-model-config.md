# 🤖 Midscene.js 模型配置指南

根据 [Midscene.js 官方文档](https://midscenejs.com/choose-a-model.html)，支持多种 AI 模型提供商。

## 📋 支持的模型配置

### 1. OpenAI GPT-4 Vision (推荐)

**优点**：识别精度高，稳定性好，官方推荐
**缺点**：需要付费

```bash
# 在 .env.local 中配置
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**获取方式**：
1. 访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
2. 创建新的 API Key
3. 复制以 `sk-` 开头的密钥

---

### 2. Google Gemini Vision (当前配置)

**优点**：免费额度，视觉识别能力强
**缺点**：需要 Google Cloud 账户

```bash
# 在 .env.local 中配置
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
```

**获取方式**：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 启用 Generative AI API
3. 创建 API 密钥

---

### 3. Azure OpenAI

**优点**：企业级支持，数据隐私保护
**缺点**：配置复杂，需要 Azure 订阅

```bash
# 在 .env.local 中配置
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-vision
```

---

### 4. Anthropic Claude

**优点**：安全性高，推理能力强
**缺点**：视觉功能相对较新

```bash
# 在 .env.local 中配置
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

---

### 5. 本地模型 (Ollama)

**优点**：完全本地运行，无需网络，免费
**缺点**：需要本地部署，性能依赖硬件

```bash
# 在 .env.local 中配置
OLLAMA_BASE_URL=http://localhost:11434
```

**设置步骤**：
1. 安装 [Ollama](https://ollama.ai/)
2. 下载视觉模型：`ollama pull llava`
3. 启动服务：`ollama serve`

---

## 🔧 当前项目配置状态

### 当前激活配置
- **模型提供商**：Google Gemini
- **API Key**：已配置 (已脱敏，见 .env.local)
- **状态**：✅ 可用

### 配置文件位置
- **主配置**：`.env.local`
- **功能配置**：`midscene.config.js`

---

## 🚀 配置建议

### 对于开发测试
推荐使用 **Google Gemini**（当前配置）：
- 有免费额度
- 配置简单
- 性能足够

### 对于生产环境
推荐使用 **OpenAI GPT-4 Vision**：
- 识别精度最高
- 稳定性最好
- 官方推荐

### 对于隐私敏感场景
推荐使用 **本地 Ollama**：
- 数据不离开本地
- 完全免费
- 可控性强

---

## 🔍 配置验证

### 检查当前配置
```bash
# 运行配置检查脚本
node validate-midscene-config.js
```

### 测试功能
1. 启动开发服务器：`npm run dev`
2. 访问测试页面：`http://localhost:3000/test-enhanced-captcha.html`
3. 启用 Midscene 智能模式
4. 观察日志输出

---

## 🛠️ 故障排除

### 常见问题

1. **"使用传统方式检测验证码"**
   - 检查 API Key 是否正确配置
   - 验证网络连接
   - 查看控制台错误信息

2. **API 调用失败**
   - 确认 API Key 有效且有余额
   - 检查 API 服务状态
   - 验证请求格式

3. **识别精度低**
   - 尝试更换模型提供商
   - 调整图片质量设置
   - 检查验证码类型匹配

### 调试步骤
1. 查看浏览器控制台日志
2. 检查 `.browser-sessions/debug/` 目录
3. 运行配置验证脚本
4. 查看 API 提供商的使用统计

---

## 📚 参考资源

- [Midscene.js 官方文档](https://midscenejs.com/)
- [选择模型指南](https://midscenejs.com/choose-a-model.html)
- [Playwright 集成](https://midscenejs.com/integrate-with-playwright.html)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Ollama 官网](https://ollama.ai/)

---

## 💡 下一步

1. **验证当前配置**：运行测试确认 Google Gemini 工作正常
2. **考虑升级**：如需更高精度，可配置 OpenAI GPT-4 Vision
3. **本地部署**：如有隐私需求，可设置 Ollama 本地模型
4. **监控使用**：定期检查 API 使用量和成本
