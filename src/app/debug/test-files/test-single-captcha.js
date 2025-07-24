/**
 * 测试单个验证码识别 - 更真实的场景
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
          text: `识别图片中的验证码，只返回一个验证码的内容：

规则：
1. 如果有多个验证码，只返回第一个或最显眼的一个
2. 只返回验证码文字本身，如："ABCD"、"1234"、"X9M2"
3. 不要返回多行内容
4. 不要解释或描述
5. 如果是图片选择类验证码，返回："图片验证码"
6. 如果没有验证码，返回："无验证码"

示例：
- 看到 "AB7K" → 返回：AB7K
- 看到 "8529" → 返回：8529
- 看到点击图片 → 返回：图片验证码`
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
        'X-Title': 'Environment Manager - Single Captcha Test'
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

// 测试单个验证码识别
async function testSingleCaptcha() {
  console.log('🎯 测试单个验证码识别 - 真实场景');
  console.log('=' .repeat(50));

  loadEnv();

  const hasApiKey = !!process.env.OPENAI_API_KEY;
  if (!hasApiKey) {
    console.log('❌ 未配置 API Key，无法测试');
    return;
  }

  let browser = null;
  let page = null;

  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // 测试不同的单个验证码场景
    const testCases = [
      {
        name: '简单文字验证码',
        captcha: 'ABCD',
        html: `
          <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>登录验证</h2>
            <div style="background: #f0f0f0; padding: 20px; margin: 20px; border: 2px solid #ccc; font-size: 28px; font-weight: bold; letter-spacing: 5px;">
              ABCD
            </div>
            <input type="text" name="captcha" placeholder="请输入验证码" style="padding: 10px; font-size: 16px;">
            <button style="padding: 10px 20px; margin-left: 10px;">登录</button>
          </div>
        `
      },
      {
        name: '数字验证码',
        captcha: '8529',
        html: `
          <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>安全验证</h2>
            <div style="background: linear-gradient(45deg, #e0e0e0, #f5f5f5); padding: 15px; margin: 20px; border: 1px solid #999; font-size: 24px; font-weight: bold;">
              8529
            </div>
            <input type="text" name="code" placeholder="验证码" style="padding: 10px; font-size: 16px;">
            <button style="padding: 10px 20px; margin-left: 10px;">验证</button>
          </div>
        `
      },
      {
        name: '混合验证码',
        captcha: 'X9M2',
        html: `
          <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>身份验证</h2>
            <div style="background: #fff; padding: 18px; margin: 20px; border: 2px solid #666; font-size: 26px; font-weight: bold; color: #333;">
              X9M2
            </div>
            <input type="text" name="verifyCode" placeholder="请输入上方验证码" style="padding: 10px; font-size: 16px;">
            <button style="padding: 10px 20px; margin-left: 10px;">提交</button>
          </div>
        `
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. 测试 ${testCase.name} (期望: ${testCase.captcha}):`);
      
      // 设置页面内容
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${testCase.name}</title>
          <meta charset="utf-8">
        </head>
        <body>
          ${testCase.html}
        </body>
        </html>
      `);
      
      await page.waitForTimeout(1000);
      
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
        const cleanResult = result.content.replace(/\n/g, ' ').trim();
        if (cleanResult === testCase.captcha) {
          console.log(`   🎯 识别完全正确！`);
        } else if (cleanResult.includes(testCase.captcha)) {
          console.log(`   ⚠️  识别部分正确: 包含期望值 "${testCase.captcha}"`);
        } else {
          console.log(`   ❌ 识别错误: 期望 "${testCase.captcha}", 得到 "${cleanResult}"`);
        }
        
        // 性能评估
        if (result.responseTime < 5000) {
          console.log(`   ⚡ 性能优秀: 响应时间 < 5秒`);
        } else if (result.responseTime < 10000) {
          console.log(`   ✅ 性能良好: 响应时间 < 10秒`);
        } else {
          console.log(`   ⚠️  性能一般: 响应时间 > 10秒`);
        }
        
      } else {
        console.log(`   ❌ 识别失败: ${result.error}`);
        console.log(`   ⏱️  失败时间: ${result.responseTime || totalTime}ms`);
      }
      
      // 短暂等待
      await page.waitForTimeout(500);
    }

    console.log('\n📊 测试总结:');
    console.log('- 优化后的验证码识别系统测试完成');
    console.log('- 重点关注响应时间和识别准确性');
    console.log('- 建议响应时间控制在 5 秒以内');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testSingleCaptcha().catch(console.error);
}
