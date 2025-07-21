import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { createMidsceneMCPClient, MidsceneMCPClient } from '@/lib/midscene-mcp-client';

/**
 * 增强自动登录 API
 * 根据验证码类型采用不同的处理策略
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始增强自动登录...');

    const body = await request.json();
    const {
      name,
      url,
      username,
      password,
      captchaType = '无',
      notes = '',
      useMidscene = false
    } = body;

    if (!url || !username || !password) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url, username, password'
      }, { status: 400 });
    }

    console.log(`🌐 ${useMidscene ? 'Midscene.js 智能' : '增强'}登录网站: ${name}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 用户名: ${username}`);
    console.log(`🛡️ 验证码类型: ${captchaType}`);
    console.log(`🤖 使用 Midscene.js: ${useMidscene}`);

    // 创建会话目录
    const sessionId = `enhanced_${Date.now()}`;
    const sessionDir = path.join(process.cwd(), '.browser-sessions', sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`📁 会话目录: ${sessionDir}`);

    // 启动持久化浏览器上下文
    console.log('🚀 启动增强浏览器上下文...');
    const context = await chromium.launchPersistentContext(sessionDir, {
      headless: false,
      slowMo: 1000, // 慢一点便于观察
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

    console.log('✅ 增强浏览器上下文启动成功');

    const page = await context.newPage();
    
    // 设置页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 增强自动登录`;
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

    // 执行增强自动登录
    const loginResult = await performEnhancedAutoLogin(page, {
      username,
      password,
      captchaType,
      sessionDir
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
      message: `${name} 增强自动登录完成`,
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
          '✅ 增强自动登录流程已完成',
          '🌐 浏览器窗口保持打开',
          loginResult.success ? '🎉 自动登录成功！' : '🔐 请在浏览器中完成剩余登录步骤',
          captchaType !== '无' && loginResult.captchaDetected ? `🛡️ 检测到${captchaType}验证码，请手动处理` : '',
          '💪 即使关闭此页面，浏览器也会继续运行',
          '📁 所有调试信息保存在: ' + sessionDir
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ 增强自动登录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '增强自动登录失败',
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}

/**
 * 执行增强自动登录
 */
async function performEnhancedAutoLogin(page: any, config: {
  username: string;
  password: string;
  captchaType: string;
  sessionDir: string;
}): Promise<{
  success: boolean;
  usernameFilled: boolean;
  passwordFilled: boolean;
  loginButtonClicked: boolean;
  captchaDetected: boolean;
  message: string;
}> {
  try {
    console.log('🔐 开始增强自动登录流程...');

    // 1. 智能填写用户名
    console.log('🔍 智能寻找用户名字段...');
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

    // 2. 智能填写密码
    console.log('🔍 智能寻找密码字段...');
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

    // 3. 智能验证码检测和处理
    let captchaDetected = false;
    let captchaSolved = false;
    if (config.captchaType !== '无') {
      if (useMidscene) {
        console.log(`🤖 使用 Midscene.js 智能检查${config.captchaType}验证码...`);
        const captchaResult = await handleCaptchaWithMidscene(page, config.captchaType, config.sessionDir);
        captchaDetected = captchaResult.detected;
        captchaSolved = captchaResult.solved;
      } else {
        console.log(`🔧 使用传统方式检查${config.captchaType}验证码...`);
        const captchaResult = await fallbackCaptchaDetection(page, config.captchaType, config.sessionDir);
        captchaDetected = captchaResult.detected;
        captchaSolved = false; // 传统方式不自动解决
      }
    }

    // 4. 智能点击登录按钮
    console.log('🔍 智能寻找登录按钮...');
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
    const message = success ? '增强自动登录流程完成' : '部分步骤需要手动完成';

    return {
      success,
      usernameFilled,
      passwordFilled,
      loginButtonClicked,
      captchaDetected,
      message
    };

  } catch (error) {
    console.log('❌ 增强自动登录过程出错:', error);
    return {
      success: false,
      usernameFilled: false,
      passwordFilled: false,
      loginButtonClicked: false,
      captchaDetected: false,
      message: `增强自动登录失败: ${error}`
    };
  }
}

/**
 * 使用 Midscene.js 智能处理验证码
 */
async function handleCaptchaWithMidscene(
  page: any,
  captchaType: string,
  sessionDir: string
): Promise<{ detected: boolean; solved: boolean; message: string }> {
  let midsceneClient: MidsceneMCPClient | null = null;

  try {
    console.log('🤖 启动 Midscene.js MCP 客户端...');

    // 检查是否配置了 Midscene API Key
    if (!process.env.MIDSCENE_API_KEY) {
      console.log('⚠️ 未配置 MIDSCENE_API_KEY，使用传统验证码检测');
      return await fallbackCaptchaDetection(page, captchaType, sessionDir);
    }

    // 创建并连接 Midscene MCP 客户端
    midsceneClient = createMidsceneMCPClient();
    await midsceneClient.connect();

    // 截图用于分析
    const analysisScreenshot = path.join(sessionDir, 'captcha-analysis.png');
    await page.screenshot({ path: analysisScreenshot, fullPage: true });
    console.log(`📸 验证码分析截图: ${analysisScreenshot}`);

    // 使用 Midscene.js 分析验证码
    console.log('🔍 使用 Midscene.js 分析验证码...');
    const captchaAnalysis = await midsceneClient.analyzeCaptcha(
      analysisScreenshot,
      page.url()
    );

    console.log('📊 验证码分析结果:', {
      type: captchaAnalysis.type,
      confidence: captchaAnalysis.confidence,
      elementsFound: captchaAnalysis.elements.length
    });

    if (captchaAnalysis.confidence < 0.7) {
      console.log('⚠️ 验证码识别置信度较低，使用传统方法');
      return await fallbackCaptchaDetection(page, captchaType, sessionDir);
    }

    // 如果检测到验证码，尝试智能解决
    if (captchaAnalysis.elements.length > 0) {
      console.log('🛡️ 检测到验证码，尝试智能解决...');

      try {
        const solution = await midsceneClient.solveCaptcha(
          analysisScreenshot,
          captchaAnalysis.type,
          `网站类型: ${captchaType}, 页面URL: ${page.url()}`
        );

        console.log('🎯 验证码解决方案:', {
          confidence: solution.confidence,
          stepsCount: solution.steps.length
        });

        // 执行解决方案
        if (solution.confidence > 0.8 && solution.steps.length > 0) {
          console.log('🤖 执行智能验证码解决方案...');

          for (const step of solution.steps) {
            try {
              await executeAutomationStep(page, step);
              console.log(`✅ 执行步骤: ${step.description}`);
            } catch (stepError) {
              console.log(`⚠️ 步骤执行失败: ${step.description}, 错误: ${stepError}`);
            }
          }

          // 验证解决结果
          await page.waitForTimeout(2000);
          const verificationScreenshot = path.join(sessionDir, 'captcha-verification.png');
          await page.screenshot({ path: verificationScreenshot });

          const verificationResult = await midsceneClient.verifyLoginSuccess(
            verificationScreenshot,
            ['登录成功', '验证通过', '页面跳转']
          );

          if (verificationResult.isSuccess) {
            console.log('🎉 验证码智能解决成功！');
            return {
              detected: true,
              solved: true,
              message: '验证码已通过 Midscene.js 智能解决'
            };
          } else {
            console.log('⚠️ 验证码解决后验证失败，可能需要手动处理');
            return {
              detected: true,
              solved: false,
              message: '验证码已识别但自动解决失败，请手动处理'
            };
          }
        } else {
          console.log('⚠️ 验证码解决方案置信度不足，建议手动处理');
          return {
            detected: true,
            solved: false,
            message: '验证码已识别但置信度不足，建议手动处理'
          };
        }
      } catch (solveError) {
        console.log('❌ 验证码智能解决失败:', solveError);
        return {
          detected: true,
          solved: false,
          message: '验证码已识别但智能解决失败，请手动处理'
        };
      }
    } else {
      console.log('✅ 未检测到验证码');
      return { detected: false, solved: false, message: '未检测到验证码' };
    }

  } catch (error) {
    console.log('❌ Midscene.js 验证码处理失败:', error);
    // 回退到传统方法
    return await fallbackCaptchaDetection(page, captchaType, sessionDir);
  } finally {
    // 断开 MCP 连接
    if (midsceneClient) {
      try {
        await midsceneClient.disconnect();
      } catch (disconnectError) {
        console.log('⚠️ MCP 客户端断开连接失败:', disconnectError);
      }
    }
  }
}

/**
 * 执行自动化步骤
 */
async function executeAutomationStep(page: any, step: any): Promise<void> {
  switch (step.action) {
    case 'input':
      await page.locator(step.target).fill(step.value || '');
      break;
    case 'click':
      await page.locator(step.target).click();
      break;
    case 'drag':
      // 实现拖拽逻辑
      const element = page.locator(step.target);
      const box = await element.boundingBox();
      if (box && step.value) {
        const [deltaX, deltaY] = step.value.split(',').map(Number);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY);
        await page.mouse.up();
      }
      break;
    case 'wait':
      await page.waitForTimeout(parseInt(step.value || '1000'));
      break;
    default:
      console.log(`⚠️ 未知的自动化步骤: ${step.action}`);
  }
}

/**
 * 传统验证码检测方法（回退方案）
 */
async function fallbackCaptchaDetection(
  page: any,
  captchaType: string,
  sessionDir: string
): Promise<{ detected: boolean; solved: boolean; message: string }> {
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
          console.log(`🔍 传统方法检测到${captchaType}验证码: ${selector}`);

          // 截图保存验证码
          const captchaScreenshot = path.join(sessionDir, `captcha-${captchaType}.png`);
          await page.screenshot({ path: captchaScreenshot });
          console.log(`📸 验证码截图: ${captchaScreenshot}`);

          return {
            detected: true,
            solved: false,
            message: `检测到${captchaType}验证码，请手动处理`
          };
        }
      } catch (error) {
        continue;
      }
    }

    return { detected: false, solved: false, message: '未检测到验证码' };
  } catch (error) {
    console.log(`❌ 传统验证码检测失败: ${error}`);
    return { detected: false, solved: false, message: '验证码检测失败' };
  }
}
