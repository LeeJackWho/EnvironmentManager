import { chromium } from 'playwright-core';
import { recognizeImageCaptcha } from './captcha/ocr.js';
import { solveSliderCaptcha } from './captcha/slider.js';

/**
 * 自动化登录主函数
 */
export async function autoLogin(site) {
  let browser = null;
  let page = null;

  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    page = await browser.newPage();

    // 设置用户代理，模拟真实浏览器
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 设置视口大小
    await page.setViewportSize({ width: 1366, height: 768 });

    // 访问登录页面
    console.log(`正在访问: ${site.url}`);
    await page.goto(site.url, { waitUntil: 'networkidle' });

    // 等待页面加载完成
    await page.waitForTimeout(2000);

    // 查找并填写用户名
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="user"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="username"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[placeholder*="用户名"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="手机"]',
    ];

    const usernameInput = await findElement(page, usernameSelectors);
    if (usernameInput) {
      await usernameInput.clear();
      await usernameInput.type(site.username, { delay: 100 });
      console.log('用户名填写完成');
    } else {
      throw new Error('未找到用户名输入框');
    }

    // 查找并填写密码
    const passwordSelectors = [
      'input[name="password"]',
      'input[name="pwd"]',
      'input[type="password"]',
      'input[id*="password"]',
      'input[id*="pwd"]',
      'input[placeholder*="密码"]',
    ];

    const passwordInput = await findElement(page, passwordSelectors);
    if (passwordInput) {
      await passwordInput.clear();
      await passwordInput.type(site.password, { delay: 100 });
      console.log('密码填写完成');
    } else {
      throw new Error('未找到密码输入框');
    }

    // 处理验证码
    if (site.captchaType && site.captchaType !== '无') {
      console.log(`处理验证码类型: ${site.captchaType}`);
      const captchaResult = await handleCaptcha(page, site.captchaType);
      if (!captchaResult.success) {
        throw new Error(`验证码处理失败: ${captchaResult.error}`);
      }
    }

    // 查找并点击登录按钮
    const loginButtonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("登陆")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'a:has-text("登录")',
      '.login-btn',
      '#login-btn',
      '.submit-btn',
    ];

    const loginButton = await findElement(page, loginButtonSelectors);
    if (loginButton) {
      await loginButton.click();
      console.log('点击登录按钮');
    } else {
      throw new Error('未找到登录按钮');
    }

    // 等待登录结果
    await page.waitForTimeout(3000);

    // 检查是否登录成功
    const isLoginSuccess = await checkLoginSuccess(page);
    
    if (isLoginSuccess) {
      // 获取登录后的 Cookies
      const cookies = await page.context().cookies();
      console.log('登录成功，获取到 Cookies');
      
      return {
        success: true,
        cookies: cookies,
        message: '登录成功',
      };
    } else {
      // 检查是否有错误信息
      const errorMessage = await getErrorMessage(page);
      throw new Error(errorMessage || '登录失败，请检查账号密码');
    }

  } catch (error) {
    console.error('自动登录失败:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * 查找页面元素
 */
async function findElement(page, selectors) {
  for (const selector of selectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return element;
      }
    } catch (error) {
      // 继续尝试下一个选择器
    }
  }
  return null;
}

/**
 * 处理验证码
 */
async function handleCaptcha(page, captchaType) {
  try {
    switch (captchaType) {
      case '图形':
        return await handleImageCaptcha(page);
      case '滑动':
        return await handleSliderCaptcha(page);
      default:
        return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 处理图形验证码
 */
async function handleImageCaptcha(page) {
  const captchaSelectors = [
    'img[src*="captcha"]',
    'img[src*="verify"]',
    'img[alt*="验证码"]',
    '.captcha-img',
    '#captcha-img',
    '.verify-img',
  ];

  const captchaImg = await findElement(page, captchaSelectors);
  if (!captchaImg) {
    throw new Error('未找到验证码图片');
  }

  // 截取验证码图片
  const captchaBuffer = await captchaImg.screenshot();
  const captchaBase64 = captchaBuffer.toString('base64');

  // 识别验证码
  const captchaText = await recognizeImageCaptcha(captchaBase64);
  
  if (!captchaText) {
    throw new Error('验证码识别失败');
  }

  // 查找验证码输入框
  const captchaInputSelectors = [
    'input[name*="captcha"]',
    'input[name*="verify"]',
    'input[placeholder*="验证码"]',
    '.captcha-input',
    '#captcha-input',
  ];

  const captchaInput = await findElement(page, captchaInputSelectors);
  if (!captchaInput) {
    throw new Error('未找到验证码输入框');
  }

  await captchaInput.clear();
  await captchaInput.type(captchaText);

  return { success: true };
}

/**
 * 处理滑动验证码
 */
async function handleSliderCaptcha(page) {
  return await solveSliderCaptcha(page);
}

/**
 * 检查登录是否成功
 */
async function checkLoginSuccess(page) {
  const successIndicators = [
    '.user-info',
    '.user-profile',
    '.dashboard',
    '.main-content',
    'a:has-text("退出")',
    'a:has-text("注销")',
    'button:has-text("退出")',
  ];

  const failureIndicators = [
    '.error-message',
    '.login-error',
    'input[name="username"]', // 如果还能看到登录表单，说明登录失败
    'input[name="password"]',
  ];

  // 检查成功指标
  for (const selector of successIndicators) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return true;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }

  // 检查失败指标
  for (const selector of failureIndicators) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return false;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }

  // 如果都没有找到，根据 URL 变化判断
  const currentUrl = page.url();
  return !currentUrl.includes('login') && !currentUrl.includes('signin');
}

/**
 * 获取错误信息
 */
async function getErrorMessage(page) {
  const errorSelectors = [
    '.error-message',
    '.login-error',
    '.alert-danger',
    '.error-tip',
    '.msg-error',
  ];

  for (const selector of errorSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return await element.textContent();
      }
    } catch (error) {
      // 继续尝试下一个选择器
    }
  }

  return null;
}
