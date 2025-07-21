import { chromium, Page } from 'playwright-core';
import { LoginSite } from './playwright-login';
import fs from 'fs';
import path from 'path';

export interface SessionConfig {
  userDataDir: string;
  sessionId: string;
  siteName: string;
  url: string;
  keepAlive: boolean;
}

/**
 * 持久化会话管理器
 * 创建独立的浏览器进程，即使主程序退出也保持运行
 */
export class PersistentSessionManager {
  private userDataDir: string;
  private sessionFile: string;

  constructor() {
    this.userDataDir = path.join(process.cwd(), '.browser-sessions');
    this.sessionFile = path.join(this.userDataDir, 'active-sessions.json');
    
    // 确保会话目录存在
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  /**
   * 启动持久化浏览器会话并自动登录
   * 浏览器进程独立运行，不受主程序影响
   */
  async startPersistentSession(site: LoginSite): Promise<{
    success: boolean;
    sessionId: string;
    message: string;
    browserInfo?: any;
    loginResult?: any;
  }> {
    let context = null;
    let page = null;

    try {
      const sessionId = `session_${site.id}_${Date.now()}`;
      const siteUserDataDir = path.join(this.userDataDir, sessionId);

      console.log(`🚀 启动持久化会话并自动登录: ${site.name}`);
      console.log(`📁 用户数据目录: ${siteUserDataDir}`);

      // 启动持久化浏览器上下文
      context = await chromium.launchPersistentContext(siteUserDataDir, {
        headless: false, // 始终显示界面
        slowMo: 800,     // 慢一点便于观察
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
          '--disable-plugins',
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
      });

      page = await context.newPage();

      // 设置超时
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(90000);

      // 设置页面标题
      await page.addInitScript((siteName) => {
        document.title = `${siteName} - 环境管理系统`;
      }, site.name);

      // 导航到目标页面
      console.log(`🌐 导航到: ${site.url}`);
      await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });

      // 等待页面稳定
      await page.waitForTimeout(3000);

      // 执行自动登录
      const loginResult = await this.performAutoLogin(page, site);

      // 保存会话信息
      const sessionConfig: SessionConfig = {
        userDataDir: siteUserDataDir,
        sessionId,
        siteName: site.name,
        url: site.url,
        keepAlive: true,
      };

      await this.saveSessionConfig(sessionConfig);

      // 重要：不关闭浏览器，让它独立运行
      console.log(`✅ 持久化会话已启动: ${sessionId}`);
      console.log(`🔗 浏览器将保持运行，即使主程序退出`);

      if (loginResult.success) {
        console.log(`🎉 自动登录成功！`);
      } else {
        console.log(`⚠️ 自动登录未完全成功，您可以在浏览器中手动完成`);
      }

      return {
        success: true,
        sessionId,
        message: `${site.name} 的持久化会话已启动${loginResult.success ? '，自动登录成功' : '，请手动完成登录'}`,
        browserInfo: {
          userDataDir: siteUserDataDir,
          url: site.url,
          timestamp: new Date().toISOString(),
        },
        loginResult
      };

    } catch (error) {
      console.error('启动持久化会话失败:', error);

      // 如果出错，清理资源但不关闭浏览器（如果已经启动）
      try {
        if (page && !page.isClosed()) {
          // 不关闭页面，让用户可以手动操作
        }
      } catch (cleanupError) {
        console.error('清理资源时出错:', cleanupError);
      }

      return {
        success: false,
        sessionId: '',
        message: `启动 ${site.name} 的持久化会话失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 执行完整的自动登录流程
   */
  private async performAutoLogin(page: Page, site: LoginSite): Promise<{
    success: boolean;
    message: string;
    isLoggedIn: boolean;
    needsManualAction: boolean;
  }> {
    try {
      console.log(`🔐 开始自动登录流程: ${site.name}`);

      // 1. 检查是否已经登录
      const alreadyLoggedIn = await this.checkLoginStatus(page);
      if (alreadyLoggedIn) {
        console.log(`✅ 检测到已登录状态`);
        return {
          success: true,
          message: '用户已处于登录状态',
          isLoggedIn: true,
          needsManualAction: false,
        };
      }

      // 2. 尝试填写登录信息
      const fillResult = await this.attemptAutoFill(page, site);

      if (!fillResult.usernameFilled || !fillResult.passwordFilled) {
        console.log(`⚠️ 无法自动填写登录信息，需要手动操作`);
        return {
          success: false,
          message: '无法识别登录表单，请手动填写登录信息',
          isLoggedIn: false,
          needsManualAction: true,
        };
      }

      // 3. 尝试点击登录按钮
      const loginButtonClicked = await this.attemptClickLoginButton(page);

      if (!loginButtonClicked) {
        console.log(`⚠️ 无法找到登录按钮，请手动点击`);
        return {
          success: false,
          message: '登录信息已填写，请手动点击登录按钮',
          isLoggedIn: false,
          needsManualAction: true,
        };
      }

      // 4. 等待登录结果
      console.log(`⏳ 等待登录完成...`);
      await page.waitForTimeout(5000); // 等待5秒

      // 5. 检查验证码
      const hasCaptcha = await this.checkForCaptcha(page);
      if (hasCaptcha) {
        console.log(`🔍 检测到验证码，等待手动处理...`);
        // 等待用户处理验证码
        await this.waitForCaptchaResolution(page);
      }

      // 6. 最终检查登录状态
      const finalLoginStatus = await this.checkLoginStatus(page);

      if (finalLoginStatus) {
        console.log(`🎉 自动登录成功！`);
        return {
          success: true,
          message: '自动登录成功',
          isLoggedIn: true,
          needsManualAction: false,
        };
      } else {
        console.log(`⚠️ 登录可能未完成，请检查浏览器`);
        return {
          success: false,
          message: '登录流程已执行，请在浏览器中确认登录状态',
          isLoggedIn: false,
          needsManualAction: true,
        };
      }

    } catch (error) {
      console.error('自动登录过程中发生错误:', error);
      return {
        success: false,
        message: `自动登录失败: ${error instanceof Error ? error.message : String(error)}`,
        isLoggedIn: false,
        needsManualAction: true,
      };
    }
  }

  /**
   * 尝试自动填写登录信息
   */
  private async attemptAutoFill(page: Page, site: LoginSite): Promise<{
    usernameFilled: boolean;
    passwordFilled: boolean;
  }> {
    try {
      console.log(`🔍 尝试自动填写登录信息...`);

      // 常见的用户名字段选择器
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
        '#login',
        '.username',
        '.user-input',
        '.email-input',
      ];

      // 常见的密码字段选择器
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
      ];

      // 尝试填写用户名
      let usernameFilled = false;
      for (const selector of usernameSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.clear();
            await element.fill(site.username);
            console.log(`✅ 用户名已填写: ${selector}`);
            usernameFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      // 尝试填写密码
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.clear();
            await element.fill(site.password);
            console.log(`✅ 密码已填写: ${selector}`);
            passwordFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      return { usernameFilled, passwordFilled };

    } catch (error) {
      console.log(`⚠️ 自动填写登录信息失败: ${error}`);
      return { usernameFilled: false, passwordFilled: false };
    }
  }

  /**
   * 尝试点击登录按钮
   */
  private async attemptClickLoginButton(page: Page): Promise<boolean> {
    try {
      console.log(`🔍 寻找登录按钮...`);

      const loginButtonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("登录")',
        'button:has-text("登陆")',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("提交")',
        'a:has-text("登录")',
        '.login-btn',
        '.submit-btn',
        '#login',
        '#submit',
        '[class*="login"]',
        '[class*="submit"]',
      ];

      for (const selector of loginButtonSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`🎯 找到登录按钮: ${selector}`);
            await element.click();
            console.log(`✅ 登录按钮已点击`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      console.log(`⚠️ 未找到登录按钮`);
      return false;

    } catch (error) {
      console.log(`⚠️ 点击登录按钮失败: ${error}`);
      return false;
    }
  }

  /**
   * 检查是否有验证码
   */
  private async checkForCaptcha(page: Page): Promise<boolean> {
    try {
      const captchaSelectors = [
        'img[src*="captcha"]',
        'img[src*="verify"]',
        'img[alt*="验证码"]',
        'img[alt*="captcha"]',
        '.captcha',
        '.verify-code',
        '#captcha',
        '#verify',
        '[class*="captcha"]',
        '[class*="verify"]',
      ];

      for (const selector of captchaSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`🔍 检测到验证码: ${selector}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 等待验证码处理
   */
  private async waitForCaptchaResolution(page: Page): Promise<void> {
    try {
      console.log(`⏳ 等待用户处理验证码，最多等待3分钟...`);

      // 等待页面URL变化或登录状态改变，最多3分钟
      await Promise.race([
        page.waitForURL('**', { timeout: 180000 }), // 等待URL变化
        page.waitForTimeout(180000), // 3分钟超时
      ]);

    } catch (error) {
      console.log(`⏰ 验证码等待超时`);
    }
  }

  /**
   * 检查登录状态
   */
  private async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      // 检查常见的登录状态指示器
      const loginIndicators = [
        ':text("退出")',
        ':text("注销")',
        ':text("登出")',
        ':text("Logout")',
        ':text("Sign Out")',
        '.user-info',
        '.user-avatar',
        '.logout-btn',
        '#logout',
        '[class*="user"]',
        '[class*="profile"]',
      ];

      for (const indicator of loginIndicators) {
        try {
          const element = page.locator(indicator).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ 发现登录状态指示器: ${indicator}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      // 检查是否还在登录页面
      const currentUrl = page.url().toLowerCase();
      const isOnLoginPage = (
        currentUrl.includes('login') ||
        currentUrl.includes('signin') ||
        currentUrl.includes('auth')
      );

      // 如果不在登录页面，可能已经登录成功
      if (!isOnLoginPage) {
        console.log(`✅ 已离开登录页面，可能登录成功`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 保存会话配置
   */
  private async saveSessionConfig(config: SessionConfig): Promise<void> {
    try {
      let sessions: SessionConfig[] = [];
      
      if (fs.existsSync(this.sessionFile)) {
        const content = fs.readFileSync(this.sessionFile, 'utf8');
        sessions = JSON.parse(content);
      }

      // 移除同一网站的旧会话
      sessions = sessions.filter(s => s.siteName !== config.siteName);
      sessions.push(config);

      fs.writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2));
      console.log(`💾 会话配置已保存: ${config.sessionId}`);
    } catch (error) {
      console.error('保存会话配置失败:', error);
    }
  }

  /**
   * 获取活跃会话列表
   */
  getActiveSessions(): SessionConfig[] {
    try {
      if (!fs.existsSync(this.sessionFile)) {
        return [];
      }

      const content = fs.readFileSync(this.sessionFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('读取会话配置失败:', error);
      return [];
    }
  }

  /**
   * 清理会话配置（不影响运行中的浏览器）
   */
  clearSessionConfig(sessionId?: string): void {
    try {
      if (!sessionId) {
        // 清理所有会话配置
        if (fs.existsSync(this.sessionFile)) {
          fs.unlinkSync(this.sessionFile);
        }
        console.log('🧹 所有会话配置已清理');
      } else {
        // 清理特定会话配置
        let sessions = this.getActiveSessions();
        sessions = sessions.filter(s => s.sessionId !== sessionId);
        fs.writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2));
        console.log(`🧹 会话配置已清理: ${sessionId}`);
      }
    } catch (error) {
      console.error('清理会话配置失败:', error);
    }
  }

  /**
   * 检查会话目录是否存在（判断浏览器是否可能还在运行）
   */
  isSessionDirectoryExists(sessionId: string): boolean {
    const sessionDir = path.join(this.userDataDir, sessionId);
    return fs.existsSync(sessionDir);
  }

  /**
   * 获取会话统计信息
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: SessionConfig[];
    sessionDirectories: string[];
  } {
    const activeSessions = this.getActiveSessions();
    
    let sessionDirectories: string[] = [];
    try {
      if (fs.existsSync(this.userDataDir)) {
        sessionDirectories = fs.readdirSync(this.userDataDir)
          .filter(item => {
            const fullPath = path.join(this.userDataDir, item);
            return fs.statSync(fullPath).isDirectory() && item.startsWith('session_');
          });
      }
    } catch (error) {
      console.error('读取会话目录失败:', error);
    }

    return {
      totalSessions: sessionDirectories.length,
      activeSessions,
      sessionDirectories,
    };
  }
}
