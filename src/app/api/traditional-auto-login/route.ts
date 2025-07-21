import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';

/**
 * 传统自动登录 API
 * 使用 OCR 识别和传统选择器的自动登录方案
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始传统自动登录...');

    const body = await request.json();
    const { 
      name,
      url, 
      username, 
      password, 
      captchaType = '无',
      notes = '',
      useOCR = true
    } = body;

    if (!url || !username || !password) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url, username, password'
      }, { status: 400 });
    }

    console.log(`🌐 传统登录网站: ${name}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 用户名: ${username}`);
    console.log(`🛡️ 验证码类型: ${captchaType}`);
    console.log(`🔍 使用OCR: ${useOCR}`);

    // 创建会话目录
    const sessionId = `traditional_${Date.now()}`;
    const sessionDir = path.join(process.cwd(), '.browser-sessions', sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`📁 会话目录: ${sessionDir}`);

    // 启动持久化浏览器上下文
    console.log('🚀 启动传统浏览器上下文...');
    const context = await chromium.launchPersistentContext(sessionDir, {
      headless: false,
      slowMo: 1500, // 稍慢一点便于观察
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    console.log('✅ 传统浏览器上下文启动成功');

    const page = await context.newPage();
    
    // 设置页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 传统自动登录`;
    }, name);

    console.log('✅ 页面创建成功');

    // 导航到登录页面
    console.log(`🌐 导航到: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log('✅ 页面导航成功');

    // 等待页面稳定
    console.log('⏳ 等待页面稳定...');
    await page.waitForTimeout(3000);

    // 截图保存初始状态
    const initialScreenshot = path.join(sessionDir, 'initial-page.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`📸 初始页面截图: ${initialScreenshot}`);

    // 执行传统自动登录
    const loginResult = await performTraditionalAutoLogin(page, {
      username,
      password,
      captchaType,
      sessionDir,
      useOCR
    });

    // 保存最终截图
    const finalScreenshot = path.join(sessionDir, 'final-result.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`📸 最终结果截图: ${finalScreenshot}`);

    // 保存会话信息
    const sessionInfo = {
      sessionId,
      siteName: name,
      url,
      username,
      captchaType,
      notes,
      loginResult,
      useOCR,
      timestamp: new Date().toISOString(),
      screenshots: {
        initial: initialScreenshot,
        final: finalScreenshot
      }
    };

    const sessionFile = path.join(sessionDir, 'session-info.json');
    fs.writeFileSync(sessionFile, JSON.stringify(sessionInfo, null, 2));

    console.log('💾 会话信息已保存');

    // 构建执行步骤
    const steps = [
      '✅ 浏览器启动成功',
      '✅ 页面导航完成',
      '✅ 页面稳定等待完成',
      loginResult.usernameFilled ? '✅ 用户名填写成功' : '❌ 用户名填写失败',
      loginResult.passwordFilled ? '✅ 密码填写成功' : '❌ 密码填写失败',
      loginResult.loginButtonClicked ? '✅ 登录按钮点击成功' : '❌ 登录按钮点击失败',
      loginResult.captchaDetected ? `🔍 检测到${captchaType}验证码` : '✅ 未检测到验证码',
      loginResult.ocrUsed ? '🔍 使用了OCR识别' : '📝 未使用OCR识别',
      '📸 关键步骤截图已保存',
      '🔗 浏览器保持运行，可手动完成剩余步骤'
    ];

    // 重要：不关闭浏览器，让它独立运行
    setTimeout(async () => {
      try {
        // 注意：这里不调用 context.close()，让浏览器保持运行
        console.log('✅ 浏览器将保持独立运行');
      } catch (error) {
        console.log('⚠️ 浏览器状态检查完成');
      }
    }, 2000);

    return NextResponse.json({
      success: true,
      message: `${name} 传统自动登录完成`,
      data: {
        sessionId,
        siteName: name,
        url,
        captchaType,
        loginResult,
        steps,
        timestamp: new Date().toISOString(),
        sessionDir,
        instructions: [
          '✅ 传统自动登录流程已完成',
          '🌐 浏览器窗口保持打开',
          loginResult.success ? '🎉 自动登录成功！' : '🔐 请在浏览器中完成剩余登录步骤',
          captchaType !== '无' && loginResult.captchaDetected ? `🛡️ 检测到${captchaType}验证码，${loginResult.ocrUsed ? 'OCR识别已尝试' : '请手动处理'}` : '',
          '💪 即使关闭此页面，浏览器也会继续运行',
          '📁 所有调试信息保存在: ' + sessionDir
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ 传统自动登录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '传统自动登录失败',
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}

/**
 * 执行传统自动登录
 */
async function performTraditionalAutoLogin(page: any, config: {
  username: string;
  password: string;
  captchaType: string;
  sessionDir: string;
  useOCR: boolean;
}): Promise<{
  success: boolean;
  usernameFilled: boolean;
  passwordFilled: boolean;
  loginButtonClicked: boolean;
  captchaDetected: boolean;
  ocrUsed: boolean;
  message: string;
}> {
  try {
    console.log('🔐 开始传统自动登录流程...');

    // 1. 传统方式填写用户名
    console.log('🔍 传统方式寻找用户名字段...');
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="user"]', 
      'input[name="email"]',
      'input[name="login"]',
      'input[name="account"]',
      'input[type="email"]',
      'input[type="text"][placeholder*="用户名"]',
      'input[type="text"][placeholder*="邮箱"]',
      'input[type="text"][placeholder*="手机"]',
      'input[type="text"][placeholder*="账号"]',
      'input[placeholder*="用户名"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="手机"]',
      'input[placeholder*="账号"]',
      '#username',
      '#user',
      '#email',
      '#login',
      '#account',
      '.username',
      '.user-input',
      '.email-input',
      '.login-input'
    ];

    let usernameFilled = false;
    for (const selector of usernameSelectors) {
      try {
        console.log(`🔍 尝试用户名选择器: ${selector}`);
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ 找到用户名字段: ${selector}`);
          await element.clear();
          await element.fill(config.username);
          console.log(`✅ 用户名填写完成: ${config.username}`);
          usernameFilled = true;
          
          // 截图确认
          const usernameScreenshot = path.join(config.sessionDir, 'username-filled.png');
          await page.screenshot({ path: usernameScreenshot });
          console.log(`📸 用户名填写截图: ${usernameScreenshot}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 用户名选择器失败: ${selector}`);
        continue;
      }
    }

    // 2. 传统方式填写密码
    console.log('🔍 传统方式寻找密码字段...');
    const passwordSelectors = [
      'input[name="password"]',
      'input[name="passwd"]',
      'input[name="pwd"]',
      'input[type="password"]',
      'input[placeholder*="密码"]',
      '#password',
      '#passwd',
      '#pwd',
      '.password',
      '.pwd-input',
      '.password-input'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        console.log(`🔍 尝试密码选择器: ${selector}`);
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ 找到密码字段: ${selector}`);
          await element.clear();
          await element.fill(config.password);
          console.log(`✅ 密码填写完成`);
          passwordFilled = true;
          
          // 截图确认
          const passwordScreenshot = path.join(config.sessionDir, 'password-filled.png');
          await page.screenshot({ path: passwordScreenshot });
          console.log(`📸 密码填写截图: ${passwordScreenshot}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 密码选择器失败: ${selector}`);
        continue;
      }
    }

    // 3. 传统验证码处理
    let captchaDetected = false;
    let ocrUsed = false;
    if (config.captchaType !== '无') {
      console.log(`🛡️ 传统方式检查${config.captchaType}验证码...`);
      const captchaResult = await handleTraditionalCaptcha(page, config.captchaType, config.sessionDir, config.useOCR);
      captchaDetected = captchaResult.detected;
      ocrUsed = captchaResult.ocrUsed;
    }

    // 4. 传统方式点击登录按钮
    console.log('🔍 传统方式寻找登录按钮...');
    const loginButtonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("登陆")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("提交")',
      'button:has-text("确定")',
      'a:has-text("登录")',
      '.login-btn',
      '.submit-btn',
      '.btn-login',
      '#login',
      '#submit',
      '#loginBtn'
    ];

    let loginButtonClicked = false;
    for (const selector of loginButtonSelectors) {
      try {
        console.log(`🔍 尝试登录按钮选择器: ${selector}`);
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ 找到登录按钮: ${selector}`);
          
          // 点击前截图
          const beforeClickScreenshot = path.join(config.sessionDir, 'before-login-click.png');
          await page.screenshot({ path: beforeClickScreenshot });
          console.log(`📸 点击前截图: ${beforeClickScreenshot}`);
          
          await element.click();
          console.log(`✅ 登录按钮点击完成`);
          loginButtonClicked = true;
          
          // 等待页面响应
          await page.waitForTimeout(3000);
          
          // 点击后截图
          const afterClickScreenshot = path.join(config.sessionDir, 'after-login-click.png');
          await page.screenshot({ path: afterClickScreenshot });
          console.log(`📸 点击后截图: ${afterClickScreenshot}`);
          
          break;
        }
      } catch (error) {
        console.log(`❌ 登录按钮选择器失败: ${selector}`);
        continue;
      }
    }

    const success = usernameFilled && passwordFilled && loginButtonClicked;
    const message = success ? '传统自动登录流程完成' : '部分步骤需要手动完成';

    return {
      success,
      usernameFilled,
      passwordFilled,
      loginButtonClicked,
      captchaDetected,
      ocrUsed,
      message
    };

  } catch (error) {
    console.log('❌ 传统自动登录过程出错:', error);
    return {
      success: false,
      usernameFilled: false,
      passwordFilled: false,
      loginButtonClicked: false,
      captchaDetected: false,
      ocrUsed: false,
      message: `传统自动登录失败: ${error}`
    };
  }
}

/**
 * 传统验证码处理
 */
async function handleTraditionalCaptcha(
  page: any, 
  captchaType: string, 
  sessionDir: string,
  useOCR: boolean
): Promise<{ detected: boolean; ocrUsed: boolean; message: string }> {
  try {
    const captchaSelectors: Record<string, string[]> = {
      '图形': [
        'img[src*="captcha"]',
        'img[src*="verify"]',
        'img[src*="code"]',
        'img[alt*="验证码"]',
        'img[alt*="captcha"]',
        '.captcha-img',
        '.verify-img',
        '#captcha-img',
        '#verify-img'
      ],
      '滑动': [
        '.slider-verify',
        '.slide-verify',
        '.captcha-slider',
        '[class*="slider"]',
        '[class*="slide"]',
        '.geetest_slider',
        '.nc_wrapper'
      ],
      '点击': [
        '.click-verify',
        '.captcha-click',
        '[class*="click"]',
        '.geetest_click'
      ]
    };

    const selectors = captchaSelectors[captchaType] || [];
    
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`🔍 传统方式检测到${captchaType}验证码: ${selector}`);
          
          // 截图保存验证码
          const captchaScreenshot = path.join(sessionDir, `captcha-${captchaType}.png`);
          await page.screenshot({ path: captchaScreenshot });
          console.log(`📸 验证码截图: ${captchaScreenshot}`);
          
          // 如果是图形验证码且启用OCR，尝试识别
          if (captchaType === '图形' && useOCR) {
            try {
              console.log('🔍 尝试OCR识别验证码...');
              const captchaElement = await element.screenshot();
              const ocrResult = await Tesseract.recognize(captchaElement, 'eng+chi_sim', {
                logger: m => console.log(`OCR: ${m.status} ${m.progress}`)
              });
              
              const recognizedText = ocrResult.data.text.trim().replace(/\s/g, '');
              console.log(`🔍 OCR识别结果: ${recognizedText}`);
              
              if (recognizedText.length >= 3) {
                // 尝试找到验证码输入框并填写
                const captchaInputSelectors = [
                  'input[name*="captcha"]',
                  'input[name*="verify"]',
                  'input[name*="code"]',
                  'input[placeholder*="验证码"]',
                  'input[placeholder*="captcha"]',
                  '#captcha',
                  '#verify',
                  '#code',
                  '.captcha-input'
                ];
                
                for (const inputSelector of captchaInputSelectors) {
                  try {
                    const inputElement = page.locator(inputSelector).first();
                    if (await inputElement.isVisible({ timeout: 1000 })) {
                      await inputElement.fill(recognizedText);
                      console.log(`✅ OCR验证码填写完成: ${recognizedText}`);
                      
                      const ocrScreenshot = path.join(sessionDir, 'ocr-captcha-filled.png');
                      await page.screenshot({ path: ocrScreenshot });
                      console.log(`📸 OCR填写截图: ${ocrScreenshot}`);
                      
                      return { 
                        detected: true, 
                        ocrUsed: true, 
                        message: `检测到${captchaType}验证码，OCR识别并填写: ${recognizedText}` 
                      };
                    }
                  } catch (inputError) {
                    continue;
                  }
                }
              }
              
              return { 
                detected: true, 
                ocrUsed: true, 
                message: `检测到${captchaType}验证码，OCR识别结果不理想，请手动处理` 
              };
            } catch (ocrError) {
              console.log('❌ OCR识别失败:', ocrError);
              return { 
                detected: true, 
                ocrUsed: false, 
                message: `检测到${captchaType}验证码，OCR识别失败，请手动处理` 
              };
            }
          } else {
            return { 
              detected: true, 
              ocrUsed: false, 
              message: `检测到${captchaType}验证码，请手动处理` 
            };
          }
        }
      } catch (error) {
        continue;
      }
    }

    return { detected: false, ocrUsed: false, message: '未检测到验证码' };
  } catch (error) {
    console.log(`❌ 传统验证码检测失败: ${error}`);
    return { detected: false, ocrUsed: false, message: '验证码检测失败' };
  }
}
