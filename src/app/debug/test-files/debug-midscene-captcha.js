/**
 * Midscene 验证码识别调试脚本
 * 用于测试和调试验证码识别功能
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// 加载环境变量
function loadEnv() {
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
  } else {
    console.log('⚠️ .env.local 文件不存在');
  }
}

// 获取 Midscene 配置
function getMidsceneConfig() {
  loadEnv();

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const model = process.env.MIDSCENE_MODEL_NAME || 'gpt-4-vision-preview';

  console.log('🔧 Midscene 配置检查:');
  console.log('  API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : '未设置');
  console.log('  Base URL:', baseUrl || '未设置');
  console.log('  Model:', model);

  if (!apiKey) {
    console.log('❌ 未配置 OPENAI_API_KEY');
    return null;
  }

  // 确保 URL 格式正确
  let finalBaseUrl = baseUrl;
  if (baseUrl && !baseUrl.includes('/chat/completions')) {
    finalBaseUrl = baseUrl.endsWith('/') ? baseUrl + 'chat/completions' : baseUrl + '/chat/completions';
  } else if (!baseUrl) {
    finalBaseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  console.log('  最终 API URL:', finalBaseUrl);

  return {
    apiKey,
    baseUrl: finalBaseUrl,
    model
  };
}

// 测试 AI API 连接
async function testApiConnection(config) {
  console.log('\n🌐 测试 AI API 连接...');

  const testRequest = {
    model: config.model,
    messages: [{
      role: 'user',
      content: '请回复"连接成功"'
    }],
    max_tokens: 10
  };

  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://environment-manager.local',
        'X-Title': 'Environment Manager - Connection Test'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API 连接失败:', response.status, response.statusText);
      console.log('错误详情:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ API 连接成功');
    console.log('响应:', result.choices?.[0]?.message?.content || '无内容');
    return true;

  } catch (error) {
    console.log('❌ API 连接异常:', error.message);
    return false;
  }
}

// 测试验证码识别
async function testCaptchaRecognition(config, testUrl) {
  console.log('\n🤖 测试验证码识别...');

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
    console.log(`📱 访问测试页面: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 截图
    const screenshot = await page.screenshot({ type: 'png' });
    const imageBase64 = screenshot.toString('base64');

    // 保存截图用于调试
    const debugDir = path.join(__dirname, 'debug-screenshots');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const screenshotPath = path.join(debugDir, `captcha-test-${Date.now()}.png`);
    fs.writeFileSync(screenshotPath, screenshot);
    console.log(`📸 截图已保存: ${screenshotPath}`);

    // 构建验证码识别请求
    const requestBody = {
      model: config.model,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请仔细分析这个网页截图，识别其中的验证码。

请返回JSON格式的结果：
{
  "detected": true/false,
  "type": "text/click/grid/slider/rotate/logic/drag/sequence",
  "confidence": 0.0-1.0,
  "description": "验证码的详细描述",
  "solution": {
    "text": "如果是文字验证码，这里是识别的内容"
  }
}

如果没有找到验证码，请返回 detected: false`
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

    // 发送 AI 请求
    console.log('🚀 发送验证码识别请求...');
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://environment-manager.local',
        'X-Title': 'Environment Manager - Captcha Recognition Test'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 验证码识别请求失败:', response.status, response.statusText);
      console.log('错误详情:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('📊 AI 响应:', result);

    const content = result.choices?.[0]?.message?.content || '';
    console.log('🔍 AI 识别内容:', content);

    // 尝试解析 JSON 结果
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ 验证码识别结果:', parsed);
        
        if (parsed.detected) {
          console.log(`🎯 检测到验证码类型: ${parsed.type}`);
          console.log(`📊 置信度: ${parsed.confidence}`);
          console.log(`📝 描述: ${parsed.description}`);
          if (parsed.solution?.text) {
            console.log(`💡 识别内容: ${parsed.solution.text}`);
          }
        } else {
          console.log('ℹ️ 未检测到验证码');
        }
      } else {
        console.log('⚠️ AI 响应中未找到 JSON 格式结果');
      }
    } catch (parseError) {
      console.log('⚠️ JSON 解析失败:', parseError.message);
    }

    // 保持页面打开一段时间供观察
    console.log('⏳ 保持页面打开10秒供观察...');
    await page.waitForTimeout(10000);

    return true;

  } catch (error) {
    console.log('❌ 验证码识别测试失败:', error.message);
    return false;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 主函数
async function main() {
  console.log('🎯 Midscene 验证码识别调试');
  console.log('=' .repeat(50));

  // 1. 检查配置
  const config = getMidsceneConfig();
  if (!config) {
    console.log('❌ 配置检查失败，请设置环境变量');
    return;
  }

  // 2. 测试 API 连接
  const connectionOk = await testApiConnection(config);
  if (!connectionOk) {
    console.log('❌ API 连接失败，无法继续测试');
    return;
  }

  // 3. 测试验证码识别
  const testUrl = process.argv[2] || 'https://www.google.com/recaptcha/api2/demo';
  console.log(`🌐 使用测试URL: ${testUrl}`);
  
  await testCaptchaRecognition(config, testUrl);

  console.log('\n' + '=' .repeat(50));
  console.log('✅ 调试测试完成');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}
