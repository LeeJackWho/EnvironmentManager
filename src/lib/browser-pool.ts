import { chromium, Browser, BrowserContext, Page } from 'playwright-core';

interface BrowserInstance {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  lastUsed: number;
  inUse: boolean;
}

/**
 * 浏览器池管理器
 * 复用浏览器实例以提高性能
 */
export class BrowserPool {
  private static instance: BrowserPool;
  private pool: BrowserInstance[] = [];
  private maxPoolSize = 3;
  private maxIdleTime = 5 * 60 * 1000; // 5分钟

  private constructor() {
    // 定期清理空闲的浏览器实例
    setInterval(() => {
      this.cleanupIdleInstances();
    }, 60000); // 每分钟检查一次
  }

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  /**
   * 获取可用的浏览器实例
   */
  async getBrowser(headless: boolean = false): Promise<BrowserInstance> {
    console.log(`🔍 查找可用浏览器实例 (headless: ${headless})`);

    // 查找空闲的浏览器实例
    const availableInstance = this.pool.find(
      instance => !instance.inUse && this.isBrowserValid(instance.browser)
    );

    if (availableInstance) {
      console.log(`♻️ 复用现有浏览器实例`);
      availableInstance.inUse = true;
      availableInstance.lastUsed = Date.now();
      
      // 创建新的上下文和页面
      const context = await availableInstance.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
      });
      
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(90000);

      return {
        browser: availableInstance.browser,
        context: context,
        page: page,
        lastUsed: Date.now(),
        inUse: true,
      };
    }

    // 如果池未满，创建新实例
    if (this.pool.length < this.maxPoolSize) {
      console.log(`🆕 创建新的浏览器实例`);
      return await this.createNewInstance(headless);
    }

    // 池已满，等待可用实例
    console.log(`⏳ 浏览器池已满，等待可用实例...`);
    return await this.waitForAvailableInstance(headless);
  }

  /**
   * 释放浏览器实例
   */
  async releaseBrowser(instance: BrowserInstance): Promise<void> {
    try {
      // 关闭页面和上下文，但保留浏览器
      if (instance.page) await instance.page.close();
      if (instance.context) await instance.context.close();
      
      // 标记为可用
      const poolInstance = this.pool.find(p => p.browser === instance.browser);
      if (poolInstance) {
        poolInstance.inUse = false;
        poolInstance.lastUsed = Date.now();
        console.log(`🔄 浏览器实例已释放`);
      }
    } catch (error) {
      console.error('释放浏览器实例失败:', error);
    }
  }

  /**
   * 创建新的浏览器实例
   */
  private async createNewInstance(headless: boolean): Promise<BrowserInstance> {
    const browser = await chromium.launch({
      headless: headless,
      slowMo: headless ? 0 : 500, // 图形模式下减少慢动作
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
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(90000);

    const instance: BrowserInstance = {
      browser,
      context,
      page,
      lastUsed: Date.now(),
      inUse: true,
    };

    this.pool.push(instance);
    console.log(`✅ 新浏览器实例已创建，池大小: ${this.pool.length}`);

    return instance;
  }

  /**
   * 等待可用实例
   */
  private async waitForAvailableInstance(headless: boolean): Promise<BrowserInstance> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const availableInstance = this.pool.find(
          instance => !instance.inUse && this.isBrowserValid(instance.browser)
        );

        if (availableInstance) {
          clearInterval(checkInterval);
          availableInstance.inUse = true;
          availableInstance.lastUsed = Date.now();
          resolve(availableInstance);
        }
      }, 1000);

      // 30秒超时
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('等待可用浏览器实例超时'));
      }, 30000);
    });
  }

  /**
   * 检查浏览器是否有效
   */
  private isBrowserValid(browser: Browser): boolean {
    try {
      return browser.isConnected();
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理空闲的浏览器实例
   */
  private async cleanupIdleInstances(): Promise<void> {
    const now = Date.now();
    const instancesToRemove: BrowserInstance[] = [];

    for (const instance of this.pool) {
      if (!instance.inUse && (now - instance.lastUsed) > this.maxIdleTime) {
        instancesToRemove.push(instance);
      }
    }

    for (const instance of instancesToRemove) {
      try {
        await instance.page?.close();
        await instance.context?.close();
        await instance.browser?.close();
        
        const index = this.pool.indexOf(instance);
        if (index > -1) {
          this.pool.splice(index, 1);
        }
        
        console.log(`🧹 清理空闲浏览器实例，池大小: ${this.pool.length}`);
      } catch (error) {
        console.error('清理浏览器实例失败:', error);
      }
    }
  }

  /**
   * 关闭所有浏览器实例
   */
  async closeAll(): Promise<void> {
    console.log(`🔒 关闭所有浏览器实例...`);
    
    for (const instance of this.pool) {
      try {
        await instance.page?.close();
        await instance.context?.close();
        await instance.browser?.close();
      } catch (error) {
        console.error('关闭浏览器实例失败:', error);
      }
    }
    
    this.pool = [];
    console.log(`✅ 所有浏览器实例已关闭`);
  }

  /**
   * 获取池状态
   */
  getPoolStatus(): { total: number; inUse: number; available: number } {
    const total = this.pool.length;
    const inUse = this.pool.filter(instance => instance.inUse).length;
    const available = total - inUse;

    return { total, inUse, available };
  }

  /**
   * 预热浏览器池
   */
  async warmUp(count: number = 1, headless: boolean = false): Promise<void> {
    console.log(`🔥 预热浏览器池，创建 ${count} 个实例...`);
    
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.createNewInstance(headless).then(instance => {
        instance.inUse = false; // 标记为可用
      }));
    }
    
    await Promise.all(promises);
    console.log(`✅ 浏览器池预热完成`);
  }
}
