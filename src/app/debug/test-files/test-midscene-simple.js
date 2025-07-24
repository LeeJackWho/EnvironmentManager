/**
 * 简单的 Midscene 配置测试
 * 使用 @midscene/web 的 ai() 函数进行验证码识别
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// 手动加载 .env.local
function loadEnvLocal() {
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
    
    console.log('✅ .env.local 加载成功');
  } else {
    console.log('❌ .env.local 文件不存在');
  }
}

// 获取配置
function getConfig() {
  loadEnvLocal();

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const model = process.env.MIDSCENE_MODEL_NAME || 'gpt-4-vision-preview';

  console.log('🔧 配置信息:');
  console.log('  API Key:', apiKey ? apiKey.substring(0, 10) + '...' : '未设置');
  console.log('  Base URL:', baseUrl || '未设置');
  console.log('  Model:', model);

  if (!apiKey) {
    console.log('❌ 未配置 OPENAI_API_KEY');
    return null;
  }

  return { apiKey, baseUrl, model };
}

// 模拟 @midscene/web 的 ai() 函数
async function ai(instruction, page) {
  const config = getConfig();
  if (!config) {
    throw new Error('配置无效');
  }

  console.log(`🤖 AI 指令: "${instruction}"`);

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
          text: `请执行以下指令: ${instruction}

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
  const response = await fetch(config.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://environment-manager.local',
      'X-Title': 'Environment Manager - AI Test'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';
  
  console.log('🎯 AI 响应:', content);
  return content;
}

// 测试验证码识别
async function testCaptchaRecognition() {
  console.log('🎯 测试 Midscene AI 验证码识别');
  console.log('=' .repeat(50));

  let browser = null;
  let page = null;

  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // 访问测试页面
    const testUrl = 'https://www.google.com/recaptcha/api2/demo';
    console.log(`📱 访问测试页面: ${testUrl}`);
    
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 使用 AI 指令识别验证码
    console.log('\n🤖 使用 AI 指令识别验证码...');
    const result = await ai('识别验证码类型并通过验证码校验', page);

    // 保存截图用于调试
    const debugDir = path.join(__dirname, 'debug-screenshots');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const screenshotPath = path.join(debugDir, `ai-test-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    // 保持页面打开供观察
    console.log('\n⏳ 保持页面打开10秒供观察...');
    await page.waitForTimeout(10000);

    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testCaptchaRecognition().catch(console.error);
}
