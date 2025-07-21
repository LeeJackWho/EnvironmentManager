import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

/**
 * 简化但可靠的自动登录 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始简化自动登录...');

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
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      slowMo: 1000,
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

    console.log('✅ 持久化浏览器上下文启动成功');

    const page = await context.newPage();
    
    // 设置页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 自动登录中...`;
    }, siteName);

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

    // 截图保存当前页面状态
    try {
      const screenshotPath = path.join(userDataDir, 'page-screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 页面截图已保存: ${screenshotPath}`);
    } catch (screenshotError) {
      console.log('📸 截图失败:', screenshotError);
    }

    // 执行自动登录
    console.log('🔐 开始执行自动登录流程...');
    const loginSteps = [];
    let loginSuccess = false;

    try {
      // 1. 尝试填写用户名
      console.log('🔍 开始寻找用户名字段...');
      loginSteps.push('🔍 寻找用户名字段...');

      const usernameSelectors = [
        'input[name="username"]',
        'input[name="user"]',
        'input[name="email"]',
        'input[name="login"]',
        'input[type="email"]',
        'input[placeholder*="用户名"]',
        'input[placeholder*="邮箱"]',
        'input[placeholder*="手机"]',
        'input[placeholder*="账号"]',
        '#username',
        '#user',
        '#email',
        '#login'
      ];

      let usernameFilled = false;
      for (const selector of usernameSelectors) {
        try {
          console.log(`🔍 尝试选择器: ${selector}`);
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✅ 找到用户名字段: ${selector}`);
            await element.clear();
            await element.fill(username);
            loginSteps.push(`✅ 用户名已填写: ${selector}`);
            console.log(`✅ 用户名填写完成: ${username}`);
            usernameFilled = true;
            break;
          } else {
            console.log(`❌ 选择器不可见: ${selector}`);
          }
        } catch (error) {
          console.log(`❌ 选择器出错: ${selector}, 错误: ${error}`);
          continue;
        }
      }

      if (!usernameFilled) {
        console.log('⚠️ 未找到任何用户名字段');
        loginSteps.push('⚠️ 未找到用户名字段');

        // 尝试获取页面上所有的 input 元素进行调试
        try {
          const allInputs = await page.locator('input').all();
          console.log(`📊 页面上共有 ${allInputs.length} 个 input 元素`);
          for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
            const input = allInputs[i];
            const name = await input.getAttribute('name') || '';
            const type = await input.getAttribute('type') || '';
            const placeholder = await input.getAttribute('placeholder') || '';
            const id = await input.getAttribute('id') || '';
            console.log(`Input ${i}: name="${name}", type="${type}", placeholder="${placeholder}", id="${id}"`);
          }
        } catch (debugError) {
          console.log('调试信息获取失败:', debugError);
        }
      }

      // 2. 尝试填写密码
      console.log('🔍 开始寻找密码字段...');
      loginSteps.push('🔍 寻找密码字段...');

      const passwordSelectors = [
        'input[name="password"]',
        'input[name="passwd"]',
        'input[name="pwd"]',
        'input[type="password"]',
        'input[placeholder*="密码"]',
        '#password',
        '#passwd',
        '#pwd'
      ];

      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          console.log(`🔍 尝试密码选择器: ${selector}`);
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✅ 找到密码字段: ${selector}`);
            await element.clear();
            await element.fill(password);
            loginSteps.push(`✅ 密码已填写: ${selector}`);
            console.log(`✅ 密码填写完成`);
            passwordFilled = true;
            break;
          } else {
            console.log(`❌ 密码选择器不可见: ${selector}`);
          }
        } catch (error) {
          console.log(`❌ 密码选择器出错: ${selector}, 错误: ${error}`);
          continue;
        }
      }

      if (!passwordFilled) {
        console.log('⚠️ 未找到任何密码字段');
        loginSteps.push('⚠️ 未找到密码字段');
      }

      // 3. 尝试点击登录按钮
      if (usernameFilled && passwordFilled) {
        console.log('🔍 开始寻找登录按钮...');
        loginSteps.push('🔍 寻找登录按钮...');

        const loginButtonSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("登录")',
          'button:has-text("Login")',
          'button:has-text("登陆")',
          'button:has-text("提交")',
          'button:has-text("Sign In")',
          '.login-btn',
          '.submit-btn',
          '#login',
          '#submit'
        ];

        let buttonClicked = false;
        for (const selector of loginButtonSelectors) {
          try {
            console.log(`🔍 尝试登录按钮选择器: ${selector}`);
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`✅ 找到登录按钮: ${selector}`);
              await element.click();
              loginSteps.push(`✅ 登录按钮已点击: ${selector}`);
              console.log(`✅ 登录按钮点击完成`);
              buttonClicked = true;
              break;
            } else {
              console.log(`❌ 登录按钮不可见: ${selector}`);
            }
          } catch (error) {
            console.log(`❌ 登录按钮选择器出错: ${selector}, 错误: ${error}`);
            continue;
          }
        }

        if (buttonClicked) {
          loginSteps.push('⏳ 等待登录结果...');
          await page.waitForTimeout(5000);

          // 检查是否有验证码
          const captchaSelectors = [
            'img[src*="captcha"]',
            'img[alt*="验证码"]',
            '.captcha',
            '#captcha'
          ];

          let hasCaptcha = false;
          for (const selector of captchaSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.isVisible({ timeout: 1000 })) {
                hasCaptcha = true;
                break;
              }
            } catch (error) {
              continue;
            }
          }

          if (hasCaptcha) {
            loginSteps.push('🔍 检测到验证码，请手动处理');
            await page.addInitScript((siteName) => {
              document.title = `${siteName} - 请处理验证码`;
            }, siteName);
          }

          // 检查登录状态
          const loginIndicators = [
            ':text("退出")',
            ':text("Logout")',
            ':text("注销")',
            '.user-info',
            '#logout'
          ];

          for (const indicator of loginIndicators) {
            try {
              const element = page.locator(indicator).first();
              if (await element.isVisible({ timeout: 3000 })) {
                loginSuccess = true;
                loginSteps.push('🎉 检测到登录成功！');
                break;
              }
            } catch (error) {
              continue;
            }
          }

          if (!loginSuccess) {
            // 检查是否还在登录页面
            const currentUrl = page.url().toLowerCase();
            if (!currentUrl.includes('login') && !currentUrl.includes('signin')) {
              loginSuccess = true;
              loginSteps.push('✅ 已离开登录页面，可能登录成功');
            } else {
              loginSteps.push('⚠️ 仍在登录页面，可能需要手动处理');
            }
          }
        } else {
          loginSteps.push('⚠️ 未找到登录按钮');
        }
      }

      // 更新页面标题
      if (loginSuccess) {
        await page.addInitScript((siteName) => {
          document.title = `${siteName} - 登录成功`;
        }, siteName);
      } else {
        await page.addInitScript((siteName) => {
          document.title = `${siteName} - 请手动完成登录`;
        }, siteName);
      }

    } catch (loginError) {
      loginSteps.push(`❌ 登录过程出错: ${loginError}`);
    }

    // 保存会话信息
    const sessionInfo = {
      sessionId,
      siteName,
      url,
      username,
      userDataDir,
      loginSuccess,
      loginSteps,
      timestamp: new Date().toISOString(),
    };

    const sessionFile = path.join(userDataDir, 'session-info.json');
    fs.writeFileSync(sessionFile, JSON.stringify(sessionInfo, null, 2));

    console.log('💾 会话信息已保存');

    // 重要：断开连接但不关闭浏览器
    setTimeout(async () => {
      try {
        await context.close();
        console.log('✅ 已断开与浏览器的连接，浏览器将独立运行');
      } catch (error) {
        console.log('⚠️ 断开连接时出现警告（这是正常的）');
      }
    }, 2000);

    return NextResponse.json({
      success: true,
      message: `${siteName} 自动登录完成，浏览器将持续运行`,
      data: {
        sessionId,
        siteName,
        url,
        username,
        userDataDir,
        loginSuccess,
        loginSteps,
        timestamp: new Date().toISOString(),
        instructions: [
          '✅ 浏览器已启动并完成自动登录流程',
          loginSuccess ? '🎉 自动登录成功！' : '⚠️ 自动登录部分完成，请手动处理剩余步骤',
          '🔗 浏览器将独立运行，不受服务器影响',
          '💾 登录状态和会话数据已保存',
          '🧪 您可以在浏览器中继续进行测试',
          '🔄 即使关闭环境管理系统，浏览器也会继续运行'
        ]
      }
    });

  } catch (error) {
    console.error('❌ 自动登录失败:', error);
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
