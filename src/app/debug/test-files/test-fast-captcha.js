/**
 * 测试快速验证码识别
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// 手动加载环境变量
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
  }
}

// 快速 AI 识别函数
async function fastAIRecognition(imageBase64) {
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL + '/chat/completions',
    model: process.env.MIDSCENE_MODEL_NAME
  };

  const requestBody = {
    model: config.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `快速识别验证码内容，只返回验证码文字，不要解释：

如果是文字验证码：直接返回验证码内容，如 "ABCD" 或 "1234"
如果是图片验证码：返回 "图片验证码"
如果没有验证码：返回 "无验证码"

要求：
- 只返回验证码内容，不要其他文字
- 区分大小写
- 数字和字母要准确`
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`
          }
        }
      ]
    }],
    max_tokens: 50,
    temperature: 0,
    top_p: 0.1
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const startTime = Date.now();
    
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://environment-manager.local',
        'X-Title': 'Environment Manager - Fast Captcha Test'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = Date.now();

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    return {
      success: true,
      content: content.trim(),
      responseTime: endTime - startTime
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'AI 请求超时 (15秒)',
        responseTime: 15000
      };
    }
    return {
      success: false,
      error: error.message,
      responseTime: null
    };
  }
}

// 测试快速验证码识别
async function testFastCaptcha() {
  console.log('⚡ 测试快速验证码识别系统');
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

    // 创建测试页面
    console.log('📱 创建验证码测试页面...');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>快速验证码测试</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .captcha-container { 
            background: white; 
            border: 2px solid #ddd; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .captcha-image { 
            background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
            padding: 15px; 
            text-align: center; 
            margin: 10px 0; 
            border: 1px solid #ccc;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #333;
            border-radius: 4px;
          }
          .captcha-input { 
            padding: 12px; 
            font-size: 16px; 
            border: 2px solid #ddd; 
            border-radius: 4px;
            width: 200px;
          }
          button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-left: 10px;
          }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h1>⚡ 快速验证码识别测试</h1>
        
        <div class="captcha-container">
          <h3>📝 文字验证码测试</h3>
          <div class="captcha-image">AB7K</div>
          <input type="text" class="captcha-input" name="captcha" placeholder="请输入验证码">
          <button>提交</button>
        </div>
        
        <div class="captcha-container">
          <h3>🔢 数字验证码测试</h3>
          <div class="captcha-image">8529</div>
          <input type="text" class="captcha-input" name="code" placeholder="请输入验证码">
          <button>验证</button>
        </div>
        
        <div class="captcha-container">
          <h3>🔤 混合验证码测试</h3>
          <div class="captcha-image">X9M2</div>
          <input type="text" class="captcha-input" name="verifyCode" placeholder="请输入验证码">
          <button>确认</button>
        </div>
      </body>
      </html>
    `);
    
    await page.waitForTimeout(2000);

    // 测试快速识别
    console.log('\n⚡ 开始快速验证码识别测试...');
    
    const tests = [
      { name: '文字验证码 AB7K', expected: 'AB7K' },
      { name: '数字验证码 8529', expected: '8529' },
      { name: '混合验证码 X9M2', expected: 'X9M2' }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`\n${i + 1}. 测试 ${test.name}:`);
      
      const startTime = Date.now();
      
      // 截图
      const screenshot = await page.screenshot({ type: 'png' });
      const imageBase64 = screenshot.toString('base64');
      
      // AI 识别
      const result = await fastAIRecognition(imageBase64);
      
      const totalTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`   ✅ 识别成功: "${result.content}"`);
        console.log(`   ⏱️  响应时间: ${result.responseTime}ms`);
        console.log(`   ⏱️  总时间: ${totalTime}ms`);
        
        // 检查准确性
        if (result.content === test.expected) {
          console.log(`   🎯 识别准确: 完全匹配`);
        } else if (result.content.includes(test.expected) || test.expected.includes(result.content)) {
          console.log(`   ⚠️  识别部分正确: 期望 "${test.expected}", 得到 "${result.content}"`);
        } else {
          console.log(`   ❌ 识别错误: 期望 "${test.expected}", 得到 "${result.content}"`);
        }
      } else {
        console.log(`   ❌ 识别失败: ${result.error}`);
        console.log(`   ⏱️  失败时间: ${result.responseTime || totalTime}ms`);
      }
    }

    console.log('\n⏳ 保持页面打开10秒供观察...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testFastCaptcha().catch(console.error);
}
