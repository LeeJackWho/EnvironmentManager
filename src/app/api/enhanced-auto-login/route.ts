import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { createMidsceneDirectClient, MidsceneDirectClient } from '@/lib/midscene-direct';
import { createCaptchaDebugger, CaptchaDebugger } from '@/lib/captcha-debugger';

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
      sessionDir,
      useMidscene
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
      } catch {
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
  useMidscene: boolean;
}): Promise<{
  success: boolean;
  usernameFilled: boolean;
  passwordFilled: boolean;
  loginButtonClicked: boolean;
  captchaDetected: boolean;
  captchaSolved: boolean;
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
      } catch {
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
      } catch {
        console.log(`❌ 密码选择器失败: ${selector}`);
        continue;
      }
    }

    // 3. 智能验证码检测和处理
    let captchaDetected = false;
    let captchaSolved = false;
    if (config.captchaType !== '无') {
      if (config.useMidscene) {
        console.log(`🤖 使用 Midscene.js 智能检查${config.captchaType}验证码...`);
        const captchaResult = await handleCaptchaWithMidscene(page, config.captchaType, config.sessionDir);
        captchaDetected = captchaResult.detected;
        captchaSolved = captchaResult.solved;
      } else {
        console.log(`🔧 使用传统方式检查${config.captchaType}验证码...`);
        const captchaResult = await fallbackCaptchaDetection(page, config.captchaType, config.sessionDir);
        captchaDetected = captchaResult.detected;
        captchaSolved = captchaResult.solved; // 传统方式现在支持用户手动输入
      }
    }

    // 4. 智能点击登录按钮
    console.log('🔍 智能寻找登录按钮...');

    // 如果检测到验证码但未解决，提示用户
    if (captchaDetected && !captchaSolved) {
      console.log('⚠️ 检测到验证码但未解决，跳过自动点击登录按钮');
      console.log('💡 请手动完成验证码输入后再点击登录按钮');
    }

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

    // 只有在没有检测到验证码，或者验证码已经解决的情况下才自动点击登录按钮
    if (!captchaDetected || captchaSolved) {
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
        } catch {
          console.log(`❌ 登录按钮选择器失败: ${selector}`);
          continue;
        }
      }
    } else {
      console.log('🔐 验证码未完成，等待用户手动点击登录按钮');
    }

    const success = usernameFilled && passwordFilled && loginButtonClicked;
    const message = success ? '增强自动登录流程完成' : '部分步骤需要手动完成';

    return {
      success,
      usernameFilled,
      passwordFilled,
      loginButtonClicked,
      captchaDetected,
      captchaSolved,
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
      captchaSolved: false,
      message: `增强自动登录失败: ${error}`
    };
  }
}

/**
 * 使用 Midscene.js 直接智能处理验证码
 */
async function handleCaptchaWithMidscene(
  page: any,
  captchaType: string,
  sessionDir: string
): Promise<{ detected: boolean; solved: boolean; message: string }> {
  let midsceneClient: MidsceneDirectClient | null = null;
  let captchaDebugger: CaptchaDebugger | null = null;

  try {
    console.log('🤖 启动 Midscene.js 直接客户端...');

    // 创建调试器
    const sessionId = path.basename(sessionDir);
    captchaDebugger = createCaptchaDebugger(sessionId, sessionDir, captchaType, page.url());

    // 创建并初始化 Midscene 直接客户端
    midsceneClient = createMidsceneDirectClient();

    // 尝试初始化，如果失败则回退到传统方法
    const initialized = await midsceneClient.initialize();
    if (!initialized) {
      captchaDebugger.recordExecutionStep('Midscene 客户端初始化', false, '初始化失败');
      console.warn('⚠️ Midscene 客户端初始化失败，使用传统验证码检测');
      return await fallbackCaptchaDetection(page, captchaType, sessionDir);
    }

    captchaDebugger.recordExecutionStep('Midscene 客户端初始化', true);

    // 截图用于分析
    const analysisScreenshot = path.join(sessionDir, 'captcha-analysis.png');
    await page.screenshot({ path: analysisScreenshot, fullPage: true });
    console.log(`📸 验证码分析截图: ${analysisScreenshot}`);
    captchaDebugger.recordScreenshot('analysis', analysisScreenshot);

    // 使用 Midscene.js 智能识别并解决验证码
    console.log('🔍 使用 Midscene.js 智能识别验证码...');
    let captchaResult;
    try {
      captchaResult = await midsceneClient.solveCaptchaDirectly(page, page.url());
      captchaDebugger.recordExecutionStep('智能验证码识别', true);

      console.log('📊 验证码识别结果:', {
        detected: captchaResult.detected,
        solved: captchaResult.solved,
        type: captchaResult.type,
        solution: captchaResult.solution,
        message: captchaResult.message,
        retryCount: captchaResult.retryCount,
        executionSteps: captchaResult.executionSteps?.length || 0
      });

      // 记录执行步骤到调试器
      if (captchaResult.executionSteps) {
        captchaResult.executionSteps.forEach(step => {
          captchaDebugger.recordExecutionStep(step.step, step.success, step.error);
        });
      }

      if (captchaResult.detected && captchaResult.solved) {
        console.log(`✅ 验证码智能识别并解决成功: ${captchaResult.type} - ${captchaResult.solution || '已解决'}`);
        captchaDebugger.recordFinalResult(true, true, `智能识别成功: ${captchaResult.type} - ${captchaResult.solution || '已解决'}`);
        captchaDebugger.generateDebugReport();

        return {
          detected: true,
          solved: true,
          message: `Midscene.js 智能识别并解决验证码: ${captchaResult.type} - ${captchaResult.solution || '已解决'}`
        };
      } else if (captchaResult.detected && !captchaResult.solved) {
        console.log(`⚠️ 验证码识别成功但解决失败: ${captchaResult.type} - ${captchaResult.solution || '无法解决'}`);
        captchaDebugger.recordFinalResult(true, false, captchaResult.message);
        captchaDebugger.generateDebugReport();

        return {
          detected: true,
          solved: false,
          message: captchaResult.message
        };
      } else {
        console.log('ℹ️ 未检测到验证码');
        captchaDebugger.recordFinalResult(false, false, captchaResult.message);
        captchaDebugger.generateDebugReport();

        return {
          detected: false,
          solved: false,
          message: captchaResult.message
        };
      }

    } catch (analysisError) {
      captchaDebugger.recordExecutionStep('智能验证码识别', false, String(analysisError));
      console.warn('⚠️ Midscene 智能验证码识别失败，使用传统方法:', analysisError);

      // 生成调试报告
      if (captchaDebugger) {
        captchaDebugger.recordFinalResult(false, false, '智能识别失败，回退到传统方法');
        captchaDebugger.generateDebugReport();
      }

      return await fallbackCaptchaDetection(page, captchaType, sessionDir);
    }

  } catch (error) {
    console.log('❌ Midscene.js 验证码处理失败:', error);

    // 记录错误
    if (captchaDebugger) {
      captchaDebugger.recordExecutionStep('Midscene 验证码处理', false, String(error));
      captchaDebugger.recordFinalResult(false, false, `处理失败: ${error}`);
      captchaDebugger.generateDebugReport();
    }

    // 回退到传统方法
    return await fallbackCaptchaDetection(page, captchaType, sessionDir);
  } finally {
    // 断开 Midscene 连接
    if (midsceneClient) {
      try {
        await midsceneClient.disconnect();
      } catch (disconnectError) {
        console.log('⚠️ Midscene 客户端断开连接失败:', disconnectError);
      }
    }

    // 生成最终调试报告
    if (captchaDebugger) {
      try {
        const reportPath = captchaDebugger.generateDebugReport();
        console.log(`📋 验证码调试报告已生成: ${reportPath}`);
      } catch (reportError) {
        console.warn('⚠️ 生成调试报告失败:', reportError);
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
 * 检测到验证码后提示用户手动输入，然后等待用户完成
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

          // 如果是图形验证码，提示用户手动输入并等待
          if (captchaType === '图形') {
            const userInputResult = await waitForUserCaptchaInput(page, sessionDir);
            return {
              detected: true,
              solved: userInputResult.solved,
              message: userInputResult.message
            };
          }

          return {
            detected: true,
            solved: false,
            message: `检测到${captchaType}验证码，请手动处理`
          };
        }
      } catch {
        continue;
      }
    }

    return { detected: false, solved: false, message: '未检测到验证码' };
  } catch (error) {
    console.log(`❌ 传统验证码检测失败: ${error}`);
    return { detected: false, solved: false, message: '验证码检测失败' };
  }
}

/**
 * 等待用户手动输入验证码
 */
async function waitForUserCaptchaInput(
  page: any,
  sessionDir: string
): Promise<{ solved: boolean; message: string }> {
  try {
    console.log('⏳ 等待用户手动输入验证码...');

    // 在页面中注入提示脚本
    await page.addInitScript(() => {
      // 创建提示框
      const createCaptchaPrompt = () => {
        // 检查是否已经存在提示框
        if (document.getElementById('captcha-prompt-overlay')) {
          return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'captcha-prompt-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        `;

        const promptBox = document.createElement('div');
        promptBox.style.cssText = `
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          max-width: 500px;
          text-align: center;
        `;

        promptBox.innerHTML = `
          <h2 style="color: #333; margin-bottom: 20px;">🔐 验证码输入提示</h2>
          <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
            检测到验证码，请手动输入验证码内容，然后点击下方按钮继续自动登录流程。
          </p>
          <div style="margin-bottom: 20px;">
            <strong style="color: #e74c3c;">请在页面中找到验证码输入框并输入验证码</strong>
          </div>
          <button id="captcha-continue-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
          ">✅ 我已输入验证码，继续登录</button>
          <button id="captcha-skip-btn" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">⏭️ 跳过验证码</button>
        `;

        overlay.appendChild(promptBox);
        document.body.appendChild(overlay);

        // 添加按钮事件
        const continueBtn = document.getElementById('captcha-continue-btn');
        const skipBtn = document.getElementById('captcha-skip-btn');

        if (continueBtn) {
          continueBtn.onclick = () => {
            (window as any).captchaUserAction = 'continue';
            overlay.remove();
          };
        }

        if (skipBtn) {
          skipBtn.onclick = () => {
            (window as any).captchaUserAction = 'skip';
            overlay.remove();
          };
        }
      };

      // 页面加载完成后显示提示
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCaptchaPrompt);
      } else {
        createCaptchaPrompt();
      }
    });

    // 等待页面加载并显示提示
    await page.waitForTimeout(2000);

    // 执行提示脚本
    await page.evaluate(() => {
      if (typeof (window as any).createCaptchaPrompt === 'function') {
        (window as any).createCaptchaPrompt();
      }
    });

    console.log('💬 验证码输入提示已显示，等待用户操作...');

    // 等待用户操作（最多等待5分钟）
    const maxWaitTime = 5 * 60 * 1000; // 5分钟
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const userAction = await page.evaluate(() => (window as any).captchaUserAction);

        if (userAction === 'continue') {
          console.log('✅ 用户确认已输入验证码，继续登录流程');

          // 截图记录用户输入后的状态
          const afterInputScreenshot = path.join(sessionDir, 'after-user-captcha-input.png');
          await page.screenshot({ path: afterInputScreenshot });
          console.log(`📸 用户输入后截图: ${afterInputScreenshot}`);

          return {
            solved: true,
            message: '用户已手动输入验证码，继续自动登录'
          };
        } else if (userAction === 'skip') {
          console.log('⏭️ 用户选择跳过验证码');
          return {
            solved: false,
            message: '用户选择跳过验证码输入'
          };
        }

        // 每秒检查一次
        await page.waitForTimeout(1000);
      } catch {
        // 继续等待
        await page.waitForTimeout(1000);
      }
    }

    console.log('⏰ 等待用户输入验证码超时');
    return {
      solved: false,
      message: '等待用户输入验证码超时（5分钟）'
    };

  } catch (error) {
    console.error('❌ 等待用户输入验证码失败:', error);
    return {
      solved: false,
      message: `等待用户输入失败: ${error}`
    };
  }
}
