/**
 * 测试新的验证码识别系统
 * 使用简洁的 AI 指令方式
 */

const { chromium } = require('playwright-core');
const path = require('path');

// 手动加载环境变量
function loadEnv() {
  const fs = require('fs');
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
    
    console.log('✅ 环境变量加载成功');
  }
}

// 测试验证码识别
async function testCaptchaSystem() {
  console.log('🎯 测试新的验证码识别系统');
  console.log('=' .repeat(50));

  // 加载环境变量
  loadEnv();

  // 检查配置
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  console.log('🔧 配置检查:');
  console.log('  API Key:', hasApiKey ? '已配置' : '未配置');
  console.log('  Base URL:', process.env.OPENAI_BASE_URL || '未配置');
  console.log('  Model:', process.env.MIDSCENE_MODEL_NAME || '未配置');

  if (!hasApiKey) {
    console.log('❌ 未配置 API Key，无法测试');
    return;
  }

  let browser = null;
  let page = null;

  try {
    // 启动浏览器
    console.log('\n🚀 启动浏览器...');
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // 创建一个简单的测试页面
    console.log('📱 创建测试页面...');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>验证码测试页面</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .captcha-container { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
          .captcha-input { padding: 10px; font-size: 16px; border: 1px solid #ddd; }
          .captcha-image { background: #f0f0f0; padding: 20px; text-align: center; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>验证码测试页面</h1>

        <div class="captcha-container">
          <h3>文字验证码</h3>
          <div class="captcha-image">验证码: ABCD1234</div>
          <input type="text" class="captcha-input" name="captcha" placeholder="请输入验证码">
          <button>提交</button>
        </div>

        <div class="captcha-container">
          <h3>点击验证码</h3>
          <div class="captcha-image">请点击所有包含汽车的图片</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🚗</div>
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🏠</div>
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🚗</div>
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🌳</div>
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🚗</div>
            <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">🏠</div>
          </div>
          <button>确认</button>
        </div>
      </body>
      </html>
    `);

    await page.waitForTimeout(2000);

    // 测试 MidsceneDirectClient
    console.log('\n🤖 测试 MidsceneDirectClient...');
    
    // 由于我们在 Node.js 环境中，需要模拟导入
    // 这里我们直接测试 AI 指令的核心逻辑
    const result = await testAIInstruction(page);
    
    console.log('📊 测试结果:', result);

    // 保持页面打开供观察
    console.log('\n⏳ 保持页面打开10秒供观察...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 测试 AI 指令
async function testAIInstruction(page) {
  console.log('🤖 测试 AI 指令: "识别验证码类型并通过验证码校验"');

  // 获取配置
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL + '/chat/completions',
    model: process.env.MIDSCENE_MODEL_NAME
  };

  // 截图
  const screenshot = await page.screenshot({ type: 'png' });
  const imageBase64 = screenshot.toString('base64');

  // 构建请求
  const requestBody = {
    model: config.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `请执行以下指令: 识别验证码类型并通过验证码校验

请分析网页截图，如果发现验证码，请：
1. 识别验证码类型
2. 提供解决方案
3. 返回具体的操作步骤

如果没有验证码，请说明页面内容。`
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`
          }
        }
      ]
    }],
    max_tokens: 1000,
    temperature: 0.1
  };

  // 发送请求
  console.log('🌐 发送 AI 请求...');
  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://environment-manager.local',
      'X-Title': 'Environment Manager - Captcha Test'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';
  
  console.log('🎯 AI 响应:', content);
  
  return {
    success: true,
    content,
    hasVerificationCode: content.toLowerCase().includes('验证码') || content.toLowerCase().includes('captcha')
  };
}

// 运行测试
if (require.main === module) {
  testCaptchaSystem().catch(console.error);
}
