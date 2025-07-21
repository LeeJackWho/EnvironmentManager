import { chromium } from 'playwright-core';

/**
 * 检查登录状态
 * @param {Object} site - 网站信息
 * @returns {Promise<Object>} - 检查结果
 */
export async function checkLoginStatus(site) {
  let browser = null;
  let page = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext();
    page = await context.newPage();

    // 如果有存储的Cookie，先设置Cookie
    if (site.cookies) {
      try {
        const cookies = JSON.parse(site.cookies);
        await context.addCookies(cookies);
        console.log('已设置存储的Cookie');
      } catch (error) {
        console.error('设置Cookie失败:', error);
      }
    }

    // 访问网站
    await page.goto(site.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 检查是否已登录
    const isLoggedIn = await isUserLoggedIn(page);

    if (isLoggedIn) {
      // 更新Cookie
      const currentCookies = await context.cookies();
      return {
        success: true,
        isLoggedIn: true,
        cookies: currentCookies,
        message: '用户已登录',
      };
    } else {
      return {
        success: true,
        isLoggedIn: false,
        message: '用户未登录或登录已过期',
      };
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
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
 * 维护登录会话
 * @param {Object} site - 网站信息
 * @returns {Promise<Object>} - 维护结果
 */
export async function maintainSession(site) {
  try {
    // 首先检查当前登录状态
    const statusCheck = await checkLoginStatus(site);

    if (statusCheck.success && statusCheck.isLoggedIn) {
      // 如果已登录，更新Cookie并返回
      return {
        success: true,
        maintained: true,
        cookies: statusCheck.cookies,
        message: '会话状态良好',
      };
    } else {
      // 如果未登录，需要重新登录
      return {
        success: true,
        maintained: false,
        message: '需要重新登录',
      };
    }
  } catch (error) {
    console.error('维护会话失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 刷新Cookie
 * @param {Object} site - 网站信息
 * @returns {Promise<Object>} - 刷新结果
 */
export async function refreshCookies(site) {
  let browser = null;
  let page = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext();
    page = await context.newPage();

    // 设置现有Cookie
    if (site.cookies) {
      try {
        const cookies = JSON.parse(site.cookies);
        await context.addCookies(cookies);
      } catch (error) {
        console.error('设置Cookie失败:', error);
      }
    }

    // 访问网站主页或用户中心页面
    const refreshUrls = [
      site.url.replace('/login', ''),
      site.url.replace('/signin', ''),
      site.url + '/dashboard',
      site.url + '/profile',
      site.url + '/user',
    ];

    for (const url of refreshUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        break;
      } catch (error) {
        console.log(`访问 ${url} 失败，尝试下一个URL`);
      }
    }

    await page.waitForTimeout(2000);

    // 获取刷新后的Cookie
    const refreshedCookies = await context.cookies();

    return {
      success: true,
      cookies: refreshedCookies,
      message: 'Cookie刷新成功',
    };
  } catch (error) {
    console.error('刷新Cookie失败:', error);
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
 * 判断用户是否已登录
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<boolean>} - 是否已登录
 */
async function isUserLoggedIn(page) {
  // 登录状态指标
  const loggedInIndicators = [
    '.user-info',
    '.user-profile',
    '.user-avatar',
    '.user-menu',
    '.dashboard',
    '.main-content',
    'a:has-text("退出")',
    'a:has-text("注销")',
    'a:has-text("登出")',
    'button:has-text("退出")',
    'button:has-text("注销")',
    'button:has-text("登出")',
    '[href*="logout"]',
    '[href*="signout"]',
  ];

  // 未登录状态指标
  const notLoggedInIndicators = [
    'input[name="username"]',
    'input[name="password"]',
    'button:has-text("登录")',
    'button:has-text("登陆")',
    'a:has-text("登录")',
    'a:has-text("登陆")',
    '.login-form',
    '.signin-form',
  ];

  // 检查登录指标
  for (const selector of loggedInIndicators) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        console.log(`找到登录指标: ${selector}`);
        return true;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }

  // 检查未登录指标
  for (const selector of notLoggedInIndicators) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        console.log(`找到未登录指标: ${selector}`);
        return false;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }

  // 如果都没有找到明确指标，根据URL判断
  const currentUrl = page.url();
  const isLoginPage = currentUrl.includes('login') || 
                     currentUrl.includes('signin') || 
                     currentUrl.includes('auth');

  return !isLoginPage;
}

/**
 * 清理过期Cookie
 * @param {Array} cookies - Cookie数组
 * @returns {Array} - 清理后的Cookie数组
 */
export function cleanExpiredCookies(cookies) {
  const now = Date.now() / 1000; // 转换为秒
  
  return cookies.filter(cookie => {
    // 如果Cookie没有过期时间，保留
    if (!cookie.expires) {
      return true;
    }
    
    // 如果Cookie未过期，保留
    return cookie.expires > now;
  });
}

/**
 * 格式化Cookie用于存储
 * @param {Array} cookies - Cookie数组
 * @returns {string} - 格式化后的Cookie字符串
 */
export function formatCookiesForStorage(cookies) {
  try {
    // 清理过期Cookie
    const validCookies = cleanExpiredCookies(cookies);
    
    // 只保留必要的字段
    const simplifiedCookies = validCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }));
    
    return JSON.stringify(simplifiedCookies);
  } catch (error) {
    console.error('格式化Cookie失败:', error);
    return '';
  }
}
