import { chromium, Browser, Page, BrowserContext } from 'playwright-core';
import { recognizeImageCaptcha } from './captcha/ocr';
import { solveSliderCaptcha } from './captcha/slider';

export interface LoginSite {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  captchaType?: '无' | '图形' | '滑动';
  cookies?: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  cookies?: any[];
  error?: string;
  screenshots?: string[];
}

/**
 * 智能自动登录类
 * 能够自动识别不同网站的登录元素并执行自动登录
 */
export class SmartAutoLogin {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private screenshots: string[] = [];

  /**
   * 初始化浏览器
   */
  private async initBrowser(headless: boolean = false, slowMo: number = 1000): Promise<void> {
    this.browser = await chromium.launch({
      headless: headless, // 支持图形化界面
      slowMo: slowMo, // 慢动作，便于观察
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
      // 保持登录状态的设置
      storageState: undefined, // 可以后续保存登录状态
    });

    this.page = await this.context.newPage();
  }

  /**
   * 执行自动登录
   * @param site 登录站点信息
   * @param options 登录选项
   */
  async login(site: LoginSite, options: { headless?: boolean, slowMo?: number } = {}): Promise<LoginResult> {
    try {
      console.log(`🚀 开始自动登录: ${site.name}`);
      console.log(`🌐 URL: ${site.url}`);

      // 默认使用图形界面模式
      const headless = options.headless !== undefined ? options.headless : false;
      await this.initBrowser(headless);
      if (!this.page) throw new Error('页面初始化失败');

      // 访问登录页面 - 增加超时时间并优化等待策略
      console.log(`🌐 正在访问: ${site.url}`);
      await this.page.goto(site.url, {
        waitUntil: 'domcontentloaded', // 改为更快的等待策略
        timeout: 60000 // 增加到60秒
      });

      // 等待页面基本加载完成
      await this.page.waitForLoadState('domcontentloaded');
      console.log(`✅ 页面加载完成: ${site.url}`);

      // 减少等待时间
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('01-page-loaded');

      // 智能识别并填写用户名
      const usernameSuccess = await this.fillUsername(site.username);
      if (!usernameSuccess) {
        throw new Error('无法找到或填写用户名字段');
      }

      // 智能识别并填写密码
      const passwordSuccess = await this.fillPassword(site.password);
      if (!passwordSuccess) {
        throw new Error('无法找到或填写密码字段');
      }

      await this.takeScreenshot('02-credentials-filled');

      // 处理验证码
      if (site.captchaType && site.captchaType !== '无') {
        console.log(`🔐 处理验证码类型: ${site.captchaType}`);
        const captchaResult = await this.handleCaptcha(site.captchaType);
        if (!captchaResult) {
          throw new Error(`验证码处理失败`);
        }
        await this.takeScreenshot('03-captcha-solved');
      }

      // 点击登录按钮
      const loginSuccess = await this.clickLoginButton();
      if (!loginSuccess) {
        throw new Error('无法找到或点击登录按钮');
      }

      await this.takeScreenshot('04-login-clicked');

      // 等待登录结果
      await this.page.waitForTimeout(3000);

      // 检查登录是否成功
      const isSuccess = await this.checkLoginSuccess();
      
      if (isSuccess) {
        // 获取登录后的 Cookies
        const cookies = await this.context!.cookies();
        await this.takeScreenshot('05-login-success');
        
        console.log(`✅ 登录成功: ${site.name}`);
        return {
          success: true,
          message: `${site.name} 登录成功`,
          cookies: cookies,
          screenshots: this.screenshots,
        };
      } else {
        // 检查错误信息
        const errorMessage = await this.getErrorMessage();
        await this.takeScreenshot('05-login-failed');
        
        throw new Error(errorMessage || '登录失败，请检查账号密码');
      }

    } catch (error) {
      console.error(`❌ 自动登录失败: ${site.name}`, error);
      await this.takeScreenshot('error');
      
      return {
        success: false,
        message: `${site.name} 登录失败`,
        error: error instanceof Error ? error.message : String(error),
        screenshots: this.screenshots,
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 智能识别并填写用户名
   */
  private async fillUsername(username: string): Promise<boolean> {
    const selectors = [
      // 常见的用户名字段选择器
      'input[name="username"]',
      'input[name="user"]',
      'input[name="email"]',
      'input[name="account"]',
      'input[name="loginName"]',
      'input[name="userName"]',
      'input[type="email"]',
      'input[type="text"][placeholder*="用户"]',
      'input[type="text"][placeholder*="邮箱"]',
      'input[type="text"][placeholder*="手机"]',
      'input[type="text"][placeholder*="账号"]',
      'input[id*="username"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[id*="account"]',
      'input[class*="username"]',
      'input[class*="user"]',
      'input[class*="email"]',
      'input[class*="account"]',
      // 通过标签文本识别
      'input:near(:text("用户名"))',
      'input:near(:text("邮箱"))',
      'input:near(:text("账号"))',
      'input:near(:text("手机号"))',
    ];

    return await this.smartFillField(selectors, username, '用户名');
  }

  /**
   * 智能识别并填写密码
   */
  private async fillPassword(password: string): Promise<boolean> {
    const selectors = [
      'input[name="password"]',
      'input[name="pwd"]',
      'input[name="passwd"]',
      'input[type="password"]',
      'input[id*="password"]',
      'input[id*="pwd"]',
      'input[class*="password"]',
      'input[class*="pwd"]',
      'input:near(:text("密码"))',
    ];

    return await this.smartFillField(selectors, password, '密码');
  }

  /**
   * 智能填写字段的通用方法
   */
  private async smartFillField(selectors: string[], value: string, fieldName: string): Promise<boolean> {
    if (!this.page) return false;

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        
        // 检查元素是否存在且可见
        if (await element.isVisible({ timeout: 1000 })) {
          await element.clear();
          await element.fill(value);
          console.log(`✅ ${fieldName}填写完成: ${selector}`);
          return true;
        }
      } catch (error) {
        // 继续尝试下一个选择器
        continue;
      }
    }

    // 如果常规选择器都失败，尝试更智能的方法
    return await this.fallbackFillField(value, fieldName);
  }

  /**
   * 备用的智能填写方法
   */
  private async fallbackFillField(value: string, fieldName: string): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 获取所有可见的输入框
      const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="password"], input:not([type])').all();
      
      for (const input of inputs) {
        if (await input.isVisible()) {
          const placeholder = await input.getAttribute('placeholder') || '';
          const name = await input.getAttribute('name') || '';
          const id = await input.getAttribute('id') || '';
          const type = await input.getAttribute('type') || '';
          
          // 根据属性判断是否为目标字段
          const isTargetField = this.isTargetField(placeholder + name + id, fieldName, type);
          
          if (isTargetField) {
            await input.clear();
            await input.fill(value);
            console.log(`✅ ${fieldName}填写完成 (智能识别)`);
            return true;
          }
        }
      }
    } catch (error) {
      console.error(`智能填写${fieldName}失败:`, error);
    }

    return false;
  }

  /**
   * 判断是否为目标字段
   */
  private isTargetField(text: string, fieldName: string, type: string): boolean {
    const lowerText = text.toLowerCase();
    
    if (fieldName === '用户名') {
      return (
        lowerText.includes('user') ||
        lowerText.includes('email') ||
        lowerText.includes('account') ||
        lowerText.includes('用户') ||
        lowerText.includes('邮箱') ||
        lowerText.includes('账号') ||
        lowerText.includes('手机')
      ) && type !== 'password';
    }
    
    if (fieldName === '密码') {
      return type === 'password' || lowerText.includes('password') || lowerText.includes('密码');
    }
    
    return false;
  }

  /**
   * 截图功能
   */
  private async takeScreenshot(step: string): Promise<void> {
    if (!this.page) return;
    
    try {
      const screenshot = await this.page.screenshot({ 
        fullPage: true,
        type: 'png'
      });
      const base64 = screenshot.toString('base64');
      this.screenshots.push(`data:image/png;base64,${base64}`);
      console.log(`📸 截图完成: ${step}`);
    } catch (error) {
      console.error('截图失败:', error);
    }
  }

  /**
   * 智能识别并点击登录按钮
   */
  private async clickLoginButton(): Promise<boolean> {
    if (!this.page) return false;

    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("登陆")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("提交")',
      'a:has-text("登录")',
      'a:has-text("登陆")',
      '.login-btn',
      '.submit-btn',
      '#login-btn',
      '#submit-btn',
      'button[class*="login"]',
      'button[class*="submit"]',
      'input[value*="登录"]',
      'input[value*="Login"]',
    ];

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          console.log(`✅ 登录按钮点击完成: ${selector}`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    // 备用方法：查找包含登录相关文本的按钮
    return await this.fallbackClickLogin();
  }

  /**
   * 备用登录按钮点击方法
   */
  private async fallbackClickLogin(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const buttons = await this.page.locator('button, input[type="submit"], a').all();

      for (const button of buttons) {
        if (await button.isVisible()) {
          const text = await button.textContent() || '';
          const value = await button.getAttribute('value') || '';
          const className = await button.getAttribute('class') || '';

          const combinedText = (text + value + className).toLowerCase();

          if (
            combinedText.includes('登录') ||
            combinedText.includes('登陆') ||
            combinedText.includes('login') ||
            combinedText.includes('signin') ||
            combinedText.includes('submit')
          ) {
            await button.click();
            console.log('✅ 登录按钮点击完成 (智能识别)');
            return true;
          }
        }
      }
    } catch (error) {
      console.error('智能点击登录按钮失败:', error);
    }

    return false;
  }

  /**
   * 处理验证码
   */
  private async handleCaptcha(captchaType: string): Promise<boolean> {
    if (!this.page) return false;

    try {
      switch (captchaType) {
        case '图形':
          return await this.handleImageCaptcha();
        case '滑动':
          return await this.handleSliderCaptcha();
        default:
          return true;
      }
    } catch (error) {
      console.error('自动验证码处理失败:', error);

      // 如果自动处理失败，尝试人工处理
      console.log('🔄 自动验证码处理失败，等待人工处理...');
      return await this.waitForManualCaptcha();
    }
  }

  /**
   * 等待人工验证码处理
   * 给用户3分钟时间手动处理验证码
   */
  private async waitForManualCaptcha(): Promise<boolean> {
    if (!this.page) return false;

    console.log('⏰ 等待人工验证码处理，超时时间：3分钟');

    const timeout = 3 * 60 * 1000; // 3分钟
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // 检查验证码是否已经被处理（页面是否有变化）
        const hasLoginForm = await this.hasLoginForm();

        if (!hasLoginForm) {
          console.log('✅ 检测到页面变化，验证码可能已处理');
          return true;
        }

        // 检查是否有验证码错误信息
        const hasError = await this.hasErrorMessage();
        if (hasError) {
          console.log('❌ 检测到验证码错误，继续等待');
        }

        // 每5秒检查一次
        await this.page.waitForTimeout(5000);

      } catch (error) {
        console.log('等待验证码处理时出错:', error);
        await this.page.waitForTimeout(5000);
      }
    }

    console.log('⏰ 人工验证码处理超时');
    return false;
  }

  /**
   * 检查页面是否还有登录表单
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
   * 处理图形验证码
   */
  private async handleImageCaptcha(): Promise<boolean> {
    if (!this.page) return false;

    const captchaSelectors = [
      'img[src*="captcha"]',
      'img[src*="verify"]',
      'img[src*="code"]',
      'img[alt*="验证码"]',
      'img[alt*="captcha"]',
      '.captcha-img',
      '.verify-img',
      '#captcha-img',
      '#verify-img',
    ];

    // 查找验证码图片
    let captchaImg = null;
    for (const selector of captchaSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          captchaImg = element;
          console.log(`🔍 找到验证码图片: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!captchaImg) {
      console.log('未找到验证码图片，可能不需要验证码');
      return true;
    }

    // 尝试多次识别验证码
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 第 ${attempt} 次尝试识别验证码...`);

        // 截取验证码图片
        const captchaBuffer = await captchaImg.screenshot();
        const captchaBase64 = captchaBuffer.toString('base64');

        // 识别验证码
        const captchaText = await recognizeImageCaptcha(captchaBase64);

        if (!captchaText || captchaText.length < 3) {
          console.log(`❌ 第 ${attempt} 次识别失败或结果太短: "${captchaText}"`);

          // 如果不是最后一次尝试，点击刷新验证码
          if (attempt < maxRetries) {
            await this.refreshCaptcha();
            await this.page.waitForTimeout(1000);
          }
          continue;
        }

        console.log(`🔍 第 ${attempt} 次验证码识别结果: ${captchaText}`);

        // 查找验证码输入框并填写
        const success = await this.fillCaptchaInput(captchaText);
        if (success) {
          console.log('✅ 验证码填写完成');
          return true;
        }

      } catch (error) {
        console.error(`第 ${attempt} 次验证码处理失败:`, error);

        if (attempt < maxRetries) {
          await this.refreshCaptcha();
          await this.page.waitForTimeout(1000);
        }
      }
    }

    console.error('❌ 所有验证码识别尝试都失败了');
    return false;
  }

  /**
   * 填写验证码输入框
   */
  private async fillCaptchaInput(captchaText: string): Promise<boolean> {
    if (!this.page) return false;

    const inputSelectors = [
      'input[name*="captcha"]',
      'input[name*="verify"]',
      'input[name*="code"]',
      'input[placeholder*="验证码"]',
      'input[placeholder*="captcha"]',
      'input[placeholder*="验证"]',
      '.captcha-input',
      '#captcha-input',
      '#verify-input',
      '#code-input',
    ];

    for (const selector of inputSelectors) {
      try {
        const input = this.page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          await input.clear();
          await input.fill(captchaText);
          console.log(`✅ 验证码已填入: ${selector}`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    console.error('❌ 未找到验证码输入框');
    return false;
  }

  /**
   * 刷新验证码
   */
  private async refreshCaptcha(): Promise<void> {
    if (!this.page) return;

    const refreshSelectors = [
      'img[src*="captcha"]',
      'img[src*="verify"]',
      '.captcha-refresh',
      '.refresh-captcha',
      '.captcha-img',
      '[title*="刷新"]',
      '[title*="换一张"]',
    ];

    for (const selector of refreshSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          console.log('🔄 验证码已刷新');
          return;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('⚠️ 未找到验证码刷新按钮');
  }

  /**
   * 处理滑动验证码
   */
  private async handleSliderCaptcha(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const result = await solveSliderCaptcha(this.page);
      console.log(result.success ? '✅ 滑动验证码处理完成' : '❌ 滑动验证码处理失败');
      return result.success;
    } catch (error) {
      console.error('滑动验证码处理失败:', error);
      return false;
    }
  }

  /**
   * 检查登录是否成功
   */
  private async checkLoginSuccess(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 等待页面跳转或内容变化
      await this.page.waitForTimeout(2000);

      // 检查URL是否发生变化（通常登录成功会跳转）
      const currentUrl = this.page.url();
      const hasUrlChanged = !currentUrl.includes('login') && !currentUrl.includes('signin');

      // 检查是否有登录成功的标识
      const successIndicators = [
        // 成功页面元素
        ':text("欢迎")',
        ':text("Welcome")',
        ':text("Dashboard")',
        ':text("控制台")',
        ':text("个人中心")',
        ':text("退出")',
        ':text("Logout")',
        ':text("注销")',
        '.user-info',
        '.user-avatar',
        '.logout-btn',
        '#logout',
        // 导航菜单
        '.nav-menu',
        '.main-nav',
        '.sidebar',
      ];

      for (const indicator of successIndicators) {
        try {
          const element = this.page.locator(indicator).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✅ 发现登录成功标识: ${indicator}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      // 如果URL变化且没有错误信息，认为登录成功
      if (hasUrlChanged && !(await this.hasErrorMessage())) {
        console.log('✅ URL已变化且无错误信息，判断为登录成功');
        return true;
      }

      return false;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 获取错误信息
   */
  private async getErrorMessage(): Promise<string> {
    if (!this.page) return '';

    const errorSelectors = [
      '.error-message',
      '.error-msg',
      '.alert-danger',
      '.alert-error',
      '.login-error',
      '.form-error',
      ':text("用户名或密码错误")',
      ':text("登录失败")',
      ':text("Invalid")',
      ':text("Error")',
      ':text("错误")',
    ];

    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (error) {
        continue;
      }
    }

    return '';
  }

  /**
   * 检查是否有错误信息
   */
  private async hasErrorMessage(): Promise<boolean> {
    const errorMessage = await this.getErrorMessage();
    return errorMessage.length > 0;
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
