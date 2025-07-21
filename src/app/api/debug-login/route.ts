import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

/**
 * 调试版自动登录 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🐛 开始调试版自动登录...');

    const body = await request.json();
    const { 
      url, 
      username, 
      password, 
      siteName = '调试网站'
    } = body;

    if (!url || !username || !password) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url, username, password'
      }, { status: 400 });
    }

    console.log(`🌐 调试登录网站: ${siteName}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 用户名: ${username}`);

    // 创建调试目录
    const debugId = `debug_${Date.now()}`;
    const debugDir = path.join(process.cwd(), '.browser-sessions', debugId);
    
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    console.log(`📁 调试目录: ${debugDir}`);

    // 启动浏览器（调试模式）
    console.log('🚀 启动调试浏览器...');
    const context = await chromium.launchPersistentContext(debugDir, {
      headless: false,
      slowMo: 2000, // 很慢，便于观察
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    console.log('✅ 调试浏览器启动成功');

    const page = await context.newPage();
    
    // 设置页面标题
    await page.addInitScript((siteName) => {
      document.title = `${siteName} - 调试模式`;
    }, siteName);

    console.log('✅ 调试页面创建成功');

    // 导航到登录页面
    console.log(`🌐 导航到: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log('✅ 页面导航成功');

    // 等待页面稳定
    console.log('⏳ 等待页面稳定...');
    await page.waitForTimeout(5000);

    // 截图
    const screenshotPath = path.join(debugDir, 'initial-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 初始页面截图: ${screenshotPath}`);

    // 获取页面信息
    const pageInfo = {
      url: page.url(),
      title: await page.title(),
      timestamp: new Date().toISOString(),
    };

    console.log(`📄 页面信息:`, pageInfo);

    // 分析页面上的所有表单元素
    console.log('🔍 分析页面表单元素...');
    
    const formAnalysis = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const forms = Array.from(document.querySelectorAll('form'));

      return {
        inputs: inputs.map((input, index) => ({
          index,
          tagName: input.tagName,
          type: input.type || '',
          name: input.name || '',
          id: input.id || '',
          className: input.className || '',
          placeholder: input.placeholder || '',
          value: input.value || '',
          visible: input.offsetParent !== null,
        })),
        buttons: buttons.map((button, index) => ({
          index,
          tagName: button.tagName,
          type: button.type || '',
          name: button.name || '',
          id: button.id || '',
          className: button.className || '',
          textContent: button.textContent?.trim() || '',
          visible: button.offsetParent !== null,
        })),
        forms: forms.map((form, index) => ({
          index,
          action: form.action || '',
          method: form.method || '',
          id: form.id || '',
          className: form.className || '',
        })),
      };
    });

    console.log('📊 表单分析结果:', JSON.stringify(formAnalysis, null, 2));

    // 尝试自动登录
    const loginSteps = [];
    let loginSuccess = false;

    try {
      // 1. 寻找用户名字段
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
          console.log(`🔍 尝试用户名选择器: ${selector}`);
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ 找到用户名字段: ${selector}`);
            await element.clear();
            await element.fill(username);
            loginSteps.push(`✅ 用户名已填写: ${selector}`);
            console.log(`✅ 用户名填写完成: ${username}`);
            usernameFilled = true;
            
            // 截图确认填写
            const usernameScreenshot = path.join(debugDir, 'username-filled.png');
            await page.screenshot({ path: usernameScreenshot });
            console.log(`📸 用户名填写截图: ${usernameScreenshot}`);
            break;
          }
        } catch (error) {
          console.log(`❌ 用户名选择器出错: ${selector}, 错误: ${error}`);
          continue;
        }
      }

      if (!usernameFilled) {
        console.log('⚠️ 未找到任何用户名字段');
        loginSteps.push('⚠️ 未找到用户名字段');
      }

      // 2. 寻找密码字段
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
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ 找到密码字段: ${selector}`);
            await element.clear();
            await element.fill(password);
            loginSteps.push(`✅ 密码已填写: ${selector}`);
            console.log(`✅ 密码填写完成`);
            passwordFilled = true;
            
            // 截图确认填写
            const passwordScreenshot = path.join(debugDir, 'password-filled.png');
            await page.screenshot({ path: passwordScreenshot });
            console.log(`📸 密码填写截图: ${passwordScreenshot}`);
            break;
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

      // 3. 寻找登录按钮
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
            if (await element.isVisible({ timeout: 3000 })) {
              console.log(`✅ 找到登录按钮: ${selector}`);
              
              // 截图点击前
              const beforeClickScreenshot = path.join(debugDir, 'before-click.png');
              await page.screenshot({ path: beforeClickScreenshot });
              console.log(`📸 点击前截图: ${beforeClickScreenshot}`);
              
              await element.click();
              loginSteps.push(`✅ 登录按钮已点击: ${selector}`);
              console.log(`✅ 登录按钮点击完成`);
              buttonClicked = true;
              
              // 等待页面响应
              await page.waitForTimeout(3000);
              
              // 截图点击后
              const afterClickScreenshot = path.join(debugDir, 'after-click.png');
              await page.screenshot({ path: afterClickScreenshot });
              console.log(`📸 点击后截图: ${afterClickScreenshot}`);
              
              break;
            }
          } catch (error) {
            console.log(`❌ 登录按钮选择器出错: ${selector}, 错误: ${error}`);
            continue;
          }
        }

        if (!buttonClicked) {
          console.log('⚠️ 未找到任何登录按钮');
          loginSteps.push('⚠️ 未找到登录按钮');
        }
      }

    } catch (loginError) {
      console.log('❌ 登录过程出错:', loginError);
      loginSteps.push(`❌ 登录过程出错: ${loginError}`);
    }

    // 保存调试信息
    const debugInfo = {
      debugId,
      siteName,
      url,
      username,
      debugDir,
      pageInfo,
      formAnalysis,
      loginSteps,
      timestamp: new Date().toISOString(),
    };

    const debugFile = path.join(debugDir, 'debug-info.json');
    fs.writeFileSync(debugFile, JSON.stringify(debugInfo, null, 2));

    console.log('💾 调试信息已保存');
    console.log('🔗 浏览器将保持打开，您可以手动操作');

    // 不关闭浏览器，让用户手动操作
    return NextResponse.json({
      success: true,
      message: `${siteName} 调试完成，浏览器保持打开`,
      data: {
        debugId,
        siteName,
        url,
        username,
        debugDir,
        pageInfo,
        formAnalysis,
        loginSteps,
        timestamp: new Date().toISOString(),
        instructions: [
          '✅ 调试浏览器已启动',
          '📊 页面表单分析已完成',
          '🔍 自动登录尝试已执行',
          '📸 关键步骤截图已保存',
          '🔗 浏览器将保持打开，您可以手动操作',
          '📁 所有调试信息保存在: ' + debugDir
        ]
      }
    });

  } catch (error) {
    console.error('❌ 调试登录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '调试登录失败',
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}
