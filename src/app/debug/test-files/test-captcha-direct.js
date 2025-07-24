/**
 * 直接测试验证码识别功能
 */

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

// 模拟 Midscene 直接客户端
class SimpleCaptchaClient {
  constructor() {
    this.config = {
      provider: process.env.OPENAI_API_KEY ? 'openrouter' : 'none',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.MIDSCENE_MODEL_NAME || 'anthropic/claude-3.5-sonnet',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
    };
  }

  async testCaptcha(url) {
    let browser = null;
    let context = null;
    let page = null;

    try {
      console.log('🚀 开始验证码测试...');
      console.log(`🌐 测试网站: ${url}`);
      console.log(`🤖 AI配置: ${this.config.provider} - ${this.config.model}`);

      // 启动浏览器
      browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });

      page = await context.newPage();

      // 访问网站
      console.log('📱 访问网站...');
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // 截图
      const sessionDir = path.join(__dirname, '.test-sessions', `captcha_${Date.now()}`);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const screenshotPath = path.join(sessionDir, 'page.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 页面截图: ${screenshotPath}`);

      // 检测验证码元素
      const captchaElements = await this.detectCaptchaElements(page);
      console.log(`🔍 检测到 ${captchaElements.length} 个可能的验证码元素`);

      if (captchaElements.length > 0) {
        console.log('验证码元素详情:');
        captchaElements.forEach((element, index) => {
          console.log(`  ${index + 1}. ${element.selector} (${element.type})`);
        });

        // 如果有AI配置，尝试AI识别
        if (this.config.provider !== 'none' && this.config.apiKey) {
          console.log('🤖 尝试AI识别验证码...');
          const aiResult = await this.analyzeWithAI(screenshotPath);
          console.log('AI识别结果:', aiResult);
        } else {
          console.log('⚠️ 未配置AI，跳过智能识别');
        }
      } else {
        console.log('ℹ️ 未检测到验证码元素');
      }

      // 保持页面打开一段时间供观察
      console.log('⏳ 保持页面打开10秒供观察...');
      await page.waitForTimeout(10000);

      return {
        success: true,
        captchaElements,
        screenshotPath,
        sessionDir
      };

    } catch (error) {
      console.error('❌ 测试失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    }
  }

  async detectCaptchaElements(page) {
    const selectors = [
      'input[name*="captcha"]',
      'input[name*="code"]',
      'input[name*="verify"]',
      'input[placeholder*="验证码"]',
      'input[placeholder*="captcha"]',
      '.captcha-input',
      '.verify-input',
      '#captcha',
      '#verifyCode',
      'img[src*="captcha"]',
      'img[src*="verify"]',
      '.captcha-img',
      '.slider-verify',
      '.geetest_slider'
    ];

    const elements = [];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const boundingBox = await element.boundingBox();
          elements.push({
            selector,
            type: selector.includes('input') ? 'input' : 'image',
            position: boundingBox || { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      } catch (error) {
        // 忽略不存在的元素
      }
    }

    return elements;
  }

  async analyzeWithAI(imagePath) {
    if (!this.config.apiKey) {
      return { error: '未配置API Key' };
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      const requestBody = {
        model: this.config.model,
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: '请分析这个网页截图，识别其中的验证码。如果找到验证码，请描述验证码的类型和内容。'
          }, {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          }]
        }],
        max_tokens: 500,
        temperature: 0.1
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://environment-manager.local',
          'X-Title': 'Environment Manager - Captcha Test'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        content: result.choices?.[0]?.message?.content || '无响应内容'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 主测试函数
async function main() {
  const client = new SimpleCaptchaClient();
  
  // 测试URL - 使用一个有验证码的公开测试网站
  const testUrl = 'https://www.google.com/recaptcha/api2/demo';
  
  console.log('🎯 开始验证码识别测试');
  console.log('=' .repeat(50));
  
  const result = await client.testCaptcha(testUrl);
  
  console.log('=' .repeat(50));
  console.log('📊 测试结果:');
  console.log(JSON.stringify(result, null, 2));
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleCaptchaClient };
