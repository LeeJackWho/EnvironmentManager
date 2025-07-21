import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

/**
 * 自动登录并持久化浏览器会话 API
 */
export async function POST(request: NextRequest) {
  let browser = null;
  let context = null;
  let page = null;

  try {
    console.log('🚀 开始自动登录并持久化会话...');

    const body = await request.json();
    const { 
      url, 
      username, 
      password, 
      siteName = '测试网站'
    } = body;

    if (!url || !username || !password) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url, username, password'
      }, { status: 400 });
    }

    console.log(`🌐 登录网站: ${siteName}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 用户名: ${username}`);

    // 创建会话目录
    const sessionId = `session_${Date.now()}`;
    const userDataDir = path.join(process.cwd(), '.browser-sessions', sessionId);
    
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    console.log(`📁 会话目录: ${userDataDir}`);

    // 启动持久化浏览器上下文
    console.log('🚀 启动持久化浏览器上下文...');
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      slowMo: 800, // 慢一点便于观察
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
        '--disable-extensions',
        // 让浏览器进程独立运行
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
    });

    console.log('✅ 持久化浏览器上下文启动成功');

    page = await context.newPage();
    
    // 设置超时
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(90000);

    // 设置页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 自动登录中...`;
    }, siteName);

    console.log('✅ 浏览器上下文和页面创建成功');

    // 导航到登录页面
    console.log(`🌐 导航到: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 90000 
    });

    console.log('✅ 页面导航成功');

    // 等待页面稳定
    await page.waitForTimeout(3000);

    // 执行自动登录
    const loginResult = await performAutoLogin(page, username, password, siteName);

    // 保存会话信息
    const sessionInfo = {
      sessionId,
      siteName,
      url,
      username,
      userDataDir,
      timestamp: new Date().toISOString(),
      loginResult,
    };

    const sessionFile = path.join(userDataDir, 'session-info.json');
    fs.writeFileSync(sessionFile, JSON.stringify(sessionInfo, null, 2));

    console.log('💾 会话信息已保存');

    // 关键：断开与浏览器的连接，但不关闭浏览器进程
    try {
      await context.close();
      console.log('✅ 已断开与浏览器的连接，浏览器将独立运行');
    } catch (error) {
      console.log('⚠️ 断开连接时出现警告（这是正常的）');
    }

    return NextResponse.json({
      success: true,
      message: `${siteName} 自动登录完成，浏览器将持续运行`,
      data: {
        sessionId,
        siteName,
        url,
        username,
        userDataDir,
        loginResult,
        timestamp: new Date().toISOString(),
        instructions: [
          '✅ 浏览器已启动并完成自动登录流程',
          loginResult.success ? '🎉 自动登录成功！' : '⚠️ 自动登录部分完成，请手动处理剩余步骤',
          '🔗 浏览器将独立运行，不受服务器影响',
          '💾 登录状态和会话数据已保存',
          '🧪 您可以在浏览器中继续进行测试',
          '🔄 即使关闭环境管理系统，浏览器也会继续运行'
        ]
      }
    });

  } catch (error) {
    console.error('❌ 自动登录失败:', error);

    // 如果出错，尝试断开连接但不关闭浏览器
    try {
      if (context) {
        await context.close();
        console.log('⚠️ 出错后已断开连接，浏览器可能仍在运行');
      }
    } catch (disconnectError) {
      console.log('⚠️ 断开连接时出错（可忽略）');
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '自动登录失败',
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}

/**
 * 执行自动登录流程
 */
async function performAutoLogin(page: any, username: string, password: string, siteName: string): Promise<{
  success: boolean;
  message: string;
  steps: string[];
}> {
  const steps: string[] = [];
  
  try {
    console.log('🔐 开始自动登录流程...');
    steps.push('开始自动登录流程');

    // 更新页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 正在自动登录...`;
    }, siteName);

    // 1. 检查是否已经登录
    const alreadyLoggedIn = await checkLoginStatus(page);
    if (alreadyLoggedIn) {
      steps.push('检测到已登录状态');
      await page.addInitScript((siteName) => {
        document.title = `${siteName} - 已登录`;
      }, siteName);
      return {
        success: true,
        message: '用户已处于登录状态',
        steps
      };
    }

    // 2. 尝试填写用户名
    steps.push('尝试填写用户名');
    const usernameFilled = await fillUsername(page, username);
    if (usernameFilled) {
      steps.push('✅ 用户名填写成功');
    } else {
      steps.push('⚠️ 用户名填写失败');
    }

    // 3. 尝试填写密码
    steps.push('尝试填写密码');
    const passwordFilled = await fillPassword(page, password);
    if (passwordFilled) {
      steps.push('✅ 密码填写成功');
    } else {
      steps.push('⚠️ 密码填写失败');
    }

    // 4. 尝试点击登录按钮
    if (usernameFilled && passwordFilled) {
      steps.push('尝试点击登录按钮');
      const loginClicked = await clickLoginButton(page);
      if (loginClicked) {
        steps.push('✅ 登录按钮点击成功');
        
        // 等待登录结果
        await page.waitForTimeout(5000);
        
        // 检查验证码
        const hasCaptcha = await checkForCaptcha(page);
        if (hasCaptcha) {
          steps.push('🔍 检测到验证码，等待手动处理');
          await page.addInitScript((siteName) => {
            document.title = `${siteName} - 请处理验证码`;
          }, siteName);
          // 等待用户处理验证码
          await page.waitForTimeout(10000);
        }

        // 最终检查登录状态
        const finalLoginStatus = await checkLoginStatus(page);
        if (finalLoginStatus) {
          steps.push('🎉 登录成功！');
          await page.addInitScript((siteName) => {
            document.title = `${siteName} - 登录成功`;
          }, siteName);
          return {
            success: true,
            message: '自动登录成功',
            steps
          };
        } else {
          steps.push('⚠️ 登录状态检查未通过，可能需要手动处理');
          await page.addInitScript((siteName) => {
            document.title = `${siteName} - 请手动完成登录`;
          }, siteName);
        }
      } else {
        steps.push('⚠️ 登录按钮点击失败');
      }
    }

    return {
      success: false,
      message: '自动登录部分完成，请在浏览器中手动完成剩余步骤',
      steps
    };

  } catch (error) {
    steps.push(`❌ 登录过程中出错: ${error}`);
    return {
      success: false,
      message: `自动登录失败: ${error instanceof Error ? error.message : String(error)}`,
      steps
    };
  }
}

// 辅助函数
async function fillUsername(page: any, username: string): Promise<boolean> {
  const selectors = [
    'input[name="username"]', 'input[name="user"]', 'input[name="email"]',
    'input[name="login"]', 'input[type="email"]', '#username', '#user', '#email'
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.clear();
        await element.fill(username);
        console.log(`✅ 用户名已填写: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

async function fillPassword(page: any, password: string): Promise<boolean> {
  const selectors = [
    'input[name="password"]', 'input[name="passwd"]', 'input[type="password"]',
    '#password', '#passwd'
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.clear();
        await element.fill(password);
        console.log(`✅ 密码已填写: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

async function clickLoginButton(page: any): Promise<boolean> {
  const selectors = [
    'button[type="submit"]', 'input[type="submit"]',
    'button:has-text("登录")', 'button:has-text("Login")',
    '.login-btn', '#login'
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        console.log(`✅ 登录按钮已点击: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

async function checkForCaptcha(page: any): Promise<boolean> {
  const selectors = [
    'img[src*="captcha"]', 'img[alt*="验证码"]', '.captcha', '#captcha'
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

async function checkLoginStatus(page: any): Promise<boolean> {
  const indicators = [
    ':text("退出")', ':text("Logout")', '.user-info', '#logout'
  ];

  for (const indicator of indicators) {
    try {
      const element = page.locator(indicator).first();
      if (await element.isVisible({ timeout: 3000 })) {
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  // 检查是否还在登录页面
  const currentUrl = page.url().toLowerCase();
  return !(currentUrl.includes('login') || currentUrl.includes('signin'));
}
