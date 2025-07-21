import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { LoginSite } from './playwright-login';
import fs from 'fs';
import path from 'path';

export interface PersistentBrowserOptions {
  headless?: boolean;
  slowMo?: number;
  userDataDir?: string;
  saveSession?: boolean;
}

export interface BrowserSession {
  id: string;
  siteName: string;
  url: string;
  cookies: any[];
  storageState: any;
  lastUsed: string;
}

/**
 * 持久化浏览器管理器
 * 支持保持登录状态和图形化界面
 */
export class PersistentBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private userDataDir: string;
  private sessionFile: string;

  constructor(options: PersistentBrowserOptions = {}) {
    this.userDataDir = options.userDataDir || path.join(process.cwd(), '.browser-sessions');
    this.sessionFile = path.join(this.userDataDir, 'sessions.json');
    
    // 确保会话目录存在
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  /**
   * 启动持久化浏览器
   */
  async launch(options: PersistentBrowserOptions = {}): Promise<void> {
    const {
      headless = false,
      slowMo = 1000,
      saveSession = true
    } = options;

    console.log('🚀 启动持久化浏览器...');
    console.log(`📁 用户数据目录: ${this.userDataDir}`);
    console.log(`🖥️ 图形界面模式: ${!headless ? '开启' : '关闭'}`);

    this.browser = await chromium.launch({
      headless: headless,
      slowMo: slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions-except',
        '--disable-extensions',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
      // 接受所有下载
      acceptDownloads: true,
      // 保持会话状态
      storageState: undefined,
    });

    this.page = await this.context.newPage();

    // 设置页面超时 - 增加超时时间
    this.page.setDefaultTimeout(60000); // 60秒
    this.page.setDefaultNavigationTimeout(90000); // 90秒

    console.log('✅ 持久化浏览器启动成功');
  }

  /**
   * 加载已保存的会话状态
   */
  async loadSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = this.getSavedSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        console.log(`⚠️ 未找到会话: ${sessionId}`);
        return false;
      }

      console.log(`📥 加载会话: ${session.siteName}`);

      // 设置 cookies
      if (session.cookies && session.cookies.length > 0) {
        await this.context!.addCookies(session.cookies);
        console.log(`🍪 已加载 ${session.cookies.length} 个 Cookie`);
      }

      // 设置存储状态
      if (session.storageState) {
        await this.context!.storageState(session.storageState);
        console.log('💾 已加载存储状态');
      }

      return true;
    } catch (error) {
      console.error('加载会话失败:', error);
      return false;
    }
  }

  /**
   * 保存当前会话状态
   */
  async saveSession(site: LoginSite): Promise<string> {
    try {
      if (!this.context) {
        throw new Error('浏览器上下文未初始化');
      }

      const sessionId = `${site.id}_${Date.now()}`;
      
      // 获取 cookies
      const cookies = await this.context.cookies();
      
      // 获取存储状态
      const storageState = await this.context.storageState();

      const session: BrowserSession = {
        id: sessionId,
        siteName: site.name,
        url: site.url,
        cookies: cookies,
        storageState: storageState,
        lastUsed: new Date().toISOString(),
      };

      // 保存到文件
      const sessions = this.getSavedSessions();
      
      // 移除同一网站的旧会话
      const filteredSessions = sessions.filter(s => s.siteName !== site.name);
      filteredSessions.push(session);

      fs.writeFileSync(this.sessionFile, JSON.stringify(filteredSessions, null, 2));

      console.log(`💾 会话已保存: ${sessionId}`);
      console.log(`🍪 保存了 ${cookies.length} 个 Cookie`);

      return sessionId;
    } catch (error) {
      console.error('保存会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取已保存的会话列表
   */
  getSavedSessions(): BrowserSession[] {
    try {
      if (!fs.existsSync(this.sessionFile)) {
        return [];
      }

      const content = fs.readFileSync(this.sessionFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('读取会话文件失败:', error);
      return [];
    }
  }

  /**
   * 导航到指定 URL
   */
  async goto(url: string, options: { timeout?: number, waitUntil?: string } = {}): Promise<void> {
    if (!this.page) {
      throw new Error('页面未初始化');
    }

    const { timeout = 90000, waitUntil = 'domcontentloaded' } = options;

    console.log(`🌐 导航到: ${url}`);
    console.log(`⏱️ 超时设置: ${timeout}ms, 等待策略: ${waitUntil}`);

    try {
      await this.page.goto(url, {
        waitUntil: waitUntil as any,
        timeout: timeout
      });

      // 等待页面基本加载完成
      await this.page.waitForLoadState('domcontentloaded');
      console.log(`✅ 页面导航完成: ${url}`);

    } catch (error) {
      console.error(`❌ 页面导航失败: ${url}`, error);
      throw error;
    }
  }

  /**
   * 等待用户手动操作
   */
  async waitForUserAction(message: string, timeoutMs: number = 300000): Promise<void> {
    console.log(`⏰ ${message}`);
    console.log(`⏰ 等待时间: ${timeoutMs / 1000} 秒`);
    
    if (!this.page) {
      throw new Error('页面未初始化');
    }

    // 等待页面变化或超时
    try {
      await this.page.waitForTimeout(timeoutMs);
    } catch (error) {
      console.log('⏰ 等待超时');
    }
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      // 检查常见的登录状态指示器
      const loginIndicators = [
        ':text("退出")',
        ':text("注销")',
        ':text("Logout")',
        ':text("Sign Out")',
        '.user-info',
        '.user-avatar',
        '.logout-btn',
        '#logout',
      ];

      for (const indicator of loginIndicators) {
        try {
          const element = this.page.locator(indicator).first();
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✅ 发现登录状态指示器: ${indicator}`);
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

      return !isOnLoginPage;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 获取当前页面
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * 获取浏览器上下文
   */
  getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * 关闭浏览器（但保持会话）
   */
  async close(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
      
      console.log('🔒 浏览器已关闭，会话已保存');
    } catch (error) {
      console.error('关闭浏览器失败:', error);
    }
  }

  /**
   * 清理所有会话数据
   */
  clearAllSessions(): void {
    try {
      if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
      }
      
      console.log('🧹 所有会话数据已清理');
    } catch (error) {
      console.error('清理会话数据失败:', error);
    }
  }
}
