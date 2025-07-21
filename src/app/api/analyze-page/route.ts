import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

/**
 * 页面分析 API
 * 分析登录页面结构，提供登录建议
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始页面分析...');

    const body = await request.json();
    const { url, takeScreenshot = false } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url'
      }, { status: 400 });
    }

    console.log(`🌐 分析页面: ${url}`);

    // 创建分析目录
    const analysisId = `analysis_${Date.now()}`;
    const analysisDir = path.join(process.cwd(), '.browser-sessions', analysisId);
    
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }

    // 启动浏览器
    const context = await chromium.launchPersistentContext(analysisDir, {
      headless: !takeScreenshot,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // 导航到页面
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // 等待页面稳定
    await page.waitForTimeout(3000);

    // 分析页面结构
    const pageAnalysis = await page.evaluate(() => {
      // 分析输入框
      const inputs = Array.from(document.querySelectorAll('input')).map((input, index) => ({
        index,
        type: input.type || 'text',
        name: input.name || '',
        id: input.id || '',
        className: input.className || '',
        placeholder: input.placeholder || '',
        required: input.required,
        visible: input.offsetParent !== null,
        likely_purpose: determineLikelyPurpose(input)
      }));

      // 分析按钮
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map((button, index) => ({
        index,
        tagName: button.tagName,
        type: (button as HTMLInputElement).type || '',
        textContent: button.textContent?.trim() || '',
        value: (button as HTMLInputElement).value || '',
        className: button.className || '',
        visible: button.offsetParent !== null,
        likely_purpose: determineLikelyButtonPurpose(button)
      }));

      // 分析表单
      const forms = Array.from(document.querySelectorAll('form')).map((form, index) => ({
        index,
        action: form.action || '',
        method: form.method || 'GET',
        id: form.id || '',
        className: form.className || '',
        inputCount: form.querySelectorAll('input').length,
        buttonCount: form.querySelectorAll('button, input[type="submit"]').length
      }));

      // 检测验证码
      const captchaElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        const id = el.id?.toLowerCase() || '';
        
        return text.includes('验证码') || text.includes('captcha') || 
               className.includes('captcha') || className.includes('verify') ||
               id.includes('captcha') || id.includes('verify');
      }).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent?.trim() || '',
        className: el.className || '',
        id: el.id || ''
      }));

      // 辅助函数：判断输入框用途
      function determineLikelyPurpose(input: HTMLInputElement): string {
        const name = input.name?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        const placeholder = input.placeholder?.toLowerCase() || '';
        const type = input.type?.toLowerCase() || '';

        if (type === 'password') return 'password';
        if (type === 'email') return 'email';
        
        if (name.includes('user') || name.includes('email') || name.includes('login') ||
            id.includes('user') || id.includes('email') || id.includes('login') ||
            placeholder.includes('用户') || placeholder.includes('邮箱') || placeholder.includes('账号')) {
          return 'username';
        }
        
        if (name.includes('pass') || id.includes('pass') || placeholder.includes('密码')) {
          return 'password';
        }
        
        if (name.includes('captcha') || name.includes('verify') || 
            id.includes('captcha') || id.includes('verify') ||
            placeholder.includes('验证码')) {
          return 'captcha';
        }

        return 'unknown';
      }

      // 辅助函数：判断按钮用途
      function determineLikelyButtonPurpose(button: Element): string {
        const text = button.textContent?.toLowerCase() || '';
        const value = (button as HTMLInputElement).value?.toLowerCase() || '';
        const className = button.className?.toLowerCase() || '';

        if (text.includes('登录') || text.includes('登陆') || text.includes('sign in') || text.includes('login') ||
            value.includes('登录') || value.includes('login')) {
          return 'login';
        }

        if (text.includes('提交') || text.includes('submit') || value.includes('submit')) {
          return 'submit';
        }

        if (text.includes('注册') || text.includes('register') || text.includes('sign up')) {
          return 'register';
        }

        return 'unknown';
      }

      return {
        url: window.location.href,
        title: document.title,
        inputs,
        buttons,
        forms,
        captchaElements,
        hasLoginForm: forms.some(form => 
          form.inputCount >= 2 && form.buttonCount >= 1
        )
      };
    });

    // 截图（如果需要）
    let screenshotPath = null;
    if (takeScreenshot) {
      screenshotPath = path.join(analysisDir, 'page-analysis.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    // 关闭浏览器
    await context.close();

    // 生成登录建议
    const suggestions = generateLoginSuggestions(pageAnalysis);

    // 保存分析结果
    const analysisResult = {
      analysisId,
      url,
      timestamp: new Date().toISOString(),
      pageAnalysis,
      suggestions,
      screenshotPath
    };

    const analysisFile = path.join(analysisDir, 'analysis-result.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysisResult, null, 2));

    return NextResponse.json({
      success: true,
      message: '页面分析完成',
      data: analysisResult
    });

  } catch (error) {
    console.error('❌ 页面分析失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '页面分析失败'
    }, { status: 500 });
  }
}

/**
 * 生成登录建议
 */
function generateLoginSuggestions(analysis: any) {
  const suggestions = [];

  // 检查是否有登录表单
  if (!analysis.hasLoginForm) {
    suggestions.push({
      type: 'warning',
      message: '未检测到明显的登录表单，可能需要手动定位元素'
    });
  }

  // 分析用户名字段
  const usernameInputs = analysis.inputs.filter((input: any) => 
    input.likely_purpose === 'username' || input.likely_purpose === 'email'
  );
  
  if (usernameInputs.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到明显的用户名/邮箱输入框，建议检查页面结构'
    });
  } else if (usernameInputs.length > 1) {
    suggestions.push({
      type: 'info',
      message: `找到 ${usernameInputs.length} 个可能的用户名输入框，建议选择最合适的`
    });
  }

  // 分析密码字段
  const passwordInputs = analysis.inputs.filter((input: any) => 
    input.likely_purpose === 'password'
  );
  
  if (passwordInputs.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到密码输入框，请检查页面是否完全加载'
    });
  }

  // 分析登录按钮
  const loginButtons = analysis.buttons.filter((button: any) => 
    button.likely_purpose === 'login' || button.likely_purpose === 'submit'
  );
  
  if (loginButtons.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到明显的登录按钮，可能需要自定义选择器'
    });
  }

  // 检测验证码
  if (analysis.captchaElements.length > 0) {
    suggestions.push({
      type: 'info',
      message: `检测到 ${analysis.captchaElements.length} 个可能的验证码元素，建议配置验证码类型`
    });
  }

  // 推荐选择器
  if (usernameInputs.length > 0) {
    const bestUsername = usernameInputs[0];
    suggestions.push({
      type: 'recommendation',
      message: `推荐用户名选择器: ${getBestSelector(bestUsername)}`
    });
  }

  if (passwordInputs.length > 0) {
    const bestPassword = passwordInputs[0];
    suggestions.push({
      type: 'recommendation',
      message: `推荐密码选择器: ${getBestSelector(bestPassword)}`
    });
  }

  if (loginButtons.length > 0) {
    const bestButton = loginButtons[0];
    suggestions.push({
      type: 'recommendation',
      message: `推荐登录按钮选择器: ${getBestSelector(bestButton)}`
    });
  }

  return suggestions;
}

/**
 * 获取最佳选择器
 */
function getBestSelector(element: any): string {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.name) {
    return `[name="${element.name}"]`;
  }
  if (element.className) {
    return `.${element.className.split(' ')[0]}`;
  }
  return `${element.tagName?.toLowerCase() || 'input'}[type="${element.type}"]`;
}
