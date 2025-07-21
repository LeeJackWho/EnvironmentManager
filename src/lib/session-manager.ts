import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { LoginSite } from './playwright-login';

export interface SessionStatus {
  isLoggedIn: boolean;
  lastCheck: string;
  cookies?: any[];
  error?: string;
}

export interface SessionResult {
  success: boolean;
  status: SessionStatus;
  message: string;
  needsRelogin?: boolean;
}

/**
 * 统一会话管理器
 * 负责检查、维护和复用登录状态
 *
 * 功能说明：
 * 1. 🔍 检查登录状态 - 验证现有 Cookie 是否仍然有效
 * 2. 🔄 维护会话 - 定期访问页面保持 Cookie 活跃
 * 3. 🍪 Cookie 复用 - 利用保存的 Cookie 避免重复登录
 * 4. ⚡ 快速验证 - 在自动登录前先检查是否已登录
 */
export class SessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * 检查网站登录状态
   */
  async checkLoginStatus(site: LoginSite): Promise<SessionResult> {
    try {
      console.log(`🔍 检查网站登录状态: ${site.name}`);

      await this.initBrowser();
      if (!this.page || !this.context) {
        throw new Error('浏览器初始化失败');
      }

      // 如果有存储的 Cookie，先设置
      if (site.cookies) {
        await this.setCookies(site.cookies);
      }

      // 访问网站
      await this.page.goto(site.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      await this.page.waitForTimeout(2000);

      // 检查登录状态
      const isLoggedIn = await this.isUserLoggedIn();
      
      if (isLoggedIn) {
        // 更新 Cookie
        const currentCookies = await this.context.cookies();
        
        return {
          success: true,
          status: {
            isLoggedIn: true,
            lastCheck: new Date().toISOString(),
            cookies: currentCookies,
          },
          message: '用户已登录，会话有效',
        };
      } else {
        return {
          success: true,
          status: {
            isLoggedIn: false,
            lastCheck: new Date().toISOString(),
          },
          message: '用户未登录或会话已过期',
          needsRelogin: true,
        };
      }

    } catch (error) {
      console.error('检查登录状态失败:', error);
      return {
        success: false,
        status: {
          isLoggedIn: false,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
        message: '检查登录状态时发生错误',
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 维护会话状态
   * 通过访问特定页面来保持会话活跃
   */
  async maintainSession(site: LoginSite): Promise<SessionResult> {
    try {
      console.log(`🔄 维护会话状态: ${site.name}`);

      // 首先检查当前状态
      const statusResult = await this.checkLoginStatus(site);
      
      if (!statusResult.success) {
        return statusResult;
      }

      if (!statusResult.status.isLoggedIn) {
        return {
          success: true,
          status: statusResult.status,
          message: '会话已过期，需要重新登录',
          needsRelogin: true,
        };
      }

      // 如果已登录，执行会话维护操作
      await this.initBrowser();
      if (!this.page || !this.context) {
        throw new Error('浏览器初始化失败');
      }

      // 设置 Cookie
      if (statusResult.status.cookies) {
        await this.setCookiesFromArray(statusResult.status.cookies);
      }

      // 访问一些页面来保持会话活跃
      const maintenanceUrls = this.generateMaintenanceUrls(site.url);
      
      for (const url of maintenanceUrls) {
        try {
          await this.page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 15000 
          });
          await this.page.waitForTimeout(1000);
          console.log(`✅ 访问维护页面: ${url}`);
        } catch (error) {
          console.log(`⚠️ 维护页面访问失败: ${url}`);
          continue;
        }
      }

      // 再次检查登录状态
      const finalCheck = await this.isUserLoggedIn();
      const updatedCookies = await this.context.cookies();

      return {
        success: true,
        status: {
          isLoggedIn: finalCheck,
          lastCheck: new Date().toISOString(),
          cookies: updatedCookies,
        },
        message: finalCheck ? '会话维护成功' : '会话维护后仍未登录',
        needsRelogin: !finalCheck,
      };

    } catch (error) {
      console.error('维护会话失败:', error);
      return {
        success: false,
        status: {
          isLoggedIn: false,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
        message: '维护会话时发生错误',
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 刷新 Cookie
   */
  async refreshCookies(site: LoginSite): Promise<SessionResult> {
    try {
      console.log(`🍪 刷新 Cookie: ${site.name}`);

      await this.initBrowser();
      if (!this.page || !this.context) {
        throw new Error('浏览器初始化失败');
      }

      // 设置现有 Cookie
      if (site.cookies) {
        await this.setCookies(site.cookies);
      }

      // 访问网站主页
      await this.page.goto(site.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      await this.page.waitForTimeout(2000);

      // 检查登录状态并获取新的 Cookie
      const isLoggedIn = await this.isUserLoggedIn();
      const refreshedCookies = await this.context.cookies();

      return {
        success: true,
        status: {
          isLoggedIn,
          lastCheck: new Date().toISOString(),
          cookies: refreshedCookies,
        },
        message: isLoggedIn ? 'Cookie 刷新成功' : 'Cookie 刷新完成，但用户未登录',
        needsRelogin: !isLoggedIn,
      };

    } catch (error) {
      console.error('刷新 Cookie 失败:', error);
      return {
        success: false,
        status: {
          isLoggedIn: false,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
        message: '刷新 Cookie 时发生错误',
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
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

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();
  }

  /**
   * 设置 Cookie（从字符串）
   */
  private async setCookies(cookiesString: string): Promise<void> {
    if (!this.context || !cookiesString) return;

    try {
      const cookies = JSON.parse(cookiesString);
      if (Array.isArray(cookies)) {
        await this.context.addCookies(cookies);
        console.log('✅ Cookie 设置成功');
      }
    } catch (error) {
      console.error('设置 Cookie 失败:', error);
    }
  }

  /**
   * 设置 Cookie（从数组）
   */
  private async setCookiesFromArray(cookies: any[]): Promise<void> {
    if (!this.context || !cookies) return;

    try {
      await this.context.addCookies(cookies);
      console.log('✅ Cookie 设置成功');
    } catch (error) {
      console.error('设置 Cookie 失败:', error);
    }
  }

  /**
   * 检查用户是否已登录
   */
  private async isUserLoggedIn(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 检查登录状态的多种方法
      const loginIndicators = [
        // 用户信息相关
        ':text("欢迎")',
        ':text("Welcome")',
        ':text("个人中心")',
        ':text("用户中心")',
        ':text("我的账户")',
        ':text("退出")',
        ':text("注销")',
        ':text("Logout")',
        ':text("Sign Out")',
        
        // 页面元素
        '.user-info',
        '.user-avatar',
        '.user-menu',
        '.logout-btn',
        '.profile-menu',
        '#logout',
        '#user-menu',
        
        // 导航菜单
        '.nav-menu',
        '.main-nav',
        '.sidebar',
        '.dashboard',
        '.admin-panel',
      ];

      for (const indicator of loginIndicators) {
        try {
          const element = this.page.locator(indicator).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✅ 发现登录标识: ${indicator}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      // 检查是否在登录页面
      const currentUrl = this.page.url().toLowerCase();
      const isOnLoginPage = (
        currentUrl.includes('login') ||
        currentUrl.includes('signin') ||
        currentUrl.includes('auth')
      );

      // 如果不在登录页面，可能已经登录
      if (!isOnLoginPage) {
        // 检查是否有登录表单
        const hasLoginForm = await this.hasLoginForm();
        return !hasLoginForm;
      }

      return false;

    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 检查页面是否有登录表单
   */
  private async hasLoginForm(): Promise<boolean> {
    if (!this.page) return false;

    const loginFormSelectors = [
      'form[action*="login"]',
      'form[action*="signin"]',
      'input[type="password"]',
      'input[name="password"]',
      'input[name="username"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
    ];

    for (const selector of loginFormSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  /**
   * 生成会话维护 URL
   */
  private generateMaintenanceUrls(baseUrl: string): string[] {
    const url = new URL(baseUrl);
    const baseOrigin = url.origin;
    
    return [
      baseUrl,
      `${baseOrigin}/`,
      `${baseOrigin}/dashboard`,
      `${baseOrigin}/home`,
      `${baseOrigin}/index`,
      `${baseOrigin}/main`,
      `${baseOrigin}/profile`,
      `${baseOrigin}/user`,
    ];
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('清理资源失败:', error);
    }
  }
}
