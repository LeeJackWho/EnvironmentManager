import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PersistentBrowser } from '@/lib/persistent-browser';
import { BrowserPool } from '@/lib/browser-pool';
import { LoginSite } from '@/lib/playwright-login';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

/**
 * 获取网站信息
 */
async function getSiteById(siteId: string): Promise<Record<string, any> | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: siteId });
    
    if (!('properties' in page)) {
      throw new Error('页面数据格式错误');
    }

    const properties = page.properties as Record<string, any>;

    return {
      id: page.id,
      name: properties.Name?.title?.[0]?.text?.content || '',
      url: properties.URL?.url || '',
      username: properties.Username?.rich_text?.[0]?.text?.content || '',
      password: properties.Password?.rich_text?.[0]?.text?.content || '',
      captchaType: properties.CaptchaType?.select?.name || '无',
      cookies: properties.Cookies?.rich_text?.[0]?.text?.content || '',
      status: properties.Status?.status?.name || properties.Status?.select?.name || '未知',
      category: properties.Category?.select?.name || '',
    };
  } catch (error) {
    console.error('获取网站信息失败:', error);
    return null;
  }
}

/**
 * 更新网站状态
 */
async function updateSiteStatus(pageId: string, status: string, cookies?: string): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {
      properties: {
        'Status': {
          status: {
            name: status
          }
        },
        'LastUpdate': {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    };

    if (cookies) {
      updateData.properties['Cookies'] = {
        rich_text: [
          {
            text: {
              content: cookies
            }
          }
        ]
      };
    }

    await notion.pages.update({
      page_id: pageId,
      ...updateData
    });

    return true;
  } catch (error) {
    console.error('更新网站状态失败:', error);
    return false;
  }
}

/**
 * 检查登录状态
 */
async function checkLoginStatus(page: any): Promise<boolean> {
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
        const element = page.locator(indicator).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ 发现登录状态指示器: ${indicator}`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    // 检查是否在登录页面
    const currentUrl = page.url().toLowerCase();
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
 * 图形化自动登录 API
 */
export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少 Notion API 配置，请检查环境变量'
      }, { status: 500 });
    }

    const body = await request.json();
    const { siteId, options = {} } = body;

    if (!siteId) {
      return NextResponse.json({
        success: false,
        error: '缺少网站ID参数'
      }, { status: 400 });
    }

    console.log(`🎯 开始图形化自动登录: ${siteId}`);

    // 获取网站信息
    const siteData = await getSiteById(siteId);
    if (!siteData) {
      return NextResponse.json({
        success: false,
        error: '网站信息不存在'
      }, { status: 404 });
    }

    // 构造登录站点对象
    const loginSite: LoginSite = {
      id: siteData.id,
      name: siteData.name,
      url: siteData.url,
      username: siteData.username,
      password: siteData.password,
      captchaType: siteData.captchaType || '无',
      cookies: siteData.cookies,
    };

    // 使用浏览器池获取浏览器实例
    const browserPool = BrowserPool.getInstance();
    let browserInstance = null;

    try {
      console.log(`🔄 从浏览器池获取实例...`);
      // 获取浏览器实例（图形界面模式）
      browserInstance = await browserPool.getBrowser(false); // headless: false
      console.log(`✅ 浏览器实例获取成功`);

      // 导航到登录页面 - 使用更长的超时时间
      console.log(`🌐 开始导航到: ${loginSite.url}`);
      await browserInstance.page.goto(loginSite.url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000 // 2分钟超时
      });

      // 等待页面基本加载完成
      await browserInstance.page.waitForLoadState('domcontentloaded');
      console.log(`✅ 页面导航完成: ${loginSite.url}`);

      // 等待页面稳定
      console.log(`⏳ 等待页面稳定...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 检查是否已经登录
      const isAlreadyLoggedIn = await checkLoginStatus(browserInstance.page);
      
      if (isAlreadyLoggedIn) {
        console.log('✅ 检测到已登录状态');

        // 获取 cookies
        const cookies = await browserInstance.context.cookies();
        const cookiesString = JSON.stringify(cookies);

        // 更新数据库状态
        await updateSiteStatus(siteId, '已登录', cookiesString);

        // 释放浏览器实例
        await browserPool.releaseBrowser(browserInstance);

        return NextResponse.json({
          success: true,
          message: `${loginSite.name} 已处于登录状态`,
          data: {
            siteId,
            siteName: loginSite.name,
            status: '已登录',
            cookiesCount: cookies.length,
            timestamp: new Date().toISOString(),
            needsManualLogin: false,
          }
        });
      }

      // 需要手动登录
      console.log('🔐 需要手动登录，浏览器将保持打开状态');
      
      return NextResponse.json({
        success: true,
        message: `${loginSite.name} 浏览器已打开，请手动完成登录`,
        data: {
          siteId,
          siteName: loginSite.name,
          status: '等待手动登录',
          timestamp: new Date().toISOString(),
          needsManualLogin: true,
          instructions: [
            '1. 浏览器窗口已打开，请在其中完成登录',
            '2. 如有验证码，请手动处理',
            '3. 登录完成后，点击"确认登录完成"按钮',
            '4. 系统将自动保存登录状态'
          ]
        }
      });

    } catch (error) {
      console.error('图形化登录过程中发生错误:', error);
      
      // 确保浏览器关闭
      try {
        await browser.close();
      } catch (closeError) {
        console.error('关闭浏览器失败:', closeError);
      }

      return NextResponse.json({
        success: false,
        message: `${loginSite.name} 图形化登录失败`,
        error: error instanceof Error ? error.message : String(error),
        data: {
          siteId,
          siteName: loginSite.name,
          status: '登录失败',
          timestamp: new Date().toISOString(),
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('图形化自动登录API失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '图形化自动登录失败'
    }, { status: 500 });
  }
}

/**
 * 确认登录完成 API
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({
        success: false,
        error: '缺少网站ID参数'
      }, { status: 400 });
    }

    // 获取网站信息
    const siteData = await getSiteById(siteId);
    if (!siteData) {
      return NextResponse.json({
        success: false,
        error: '网站信息不存在'
      }, { status: 404 });
    }

    const loginSite: LoginSite = {
      id: siteData.id,
      name: siteData.name,
      url: siteData.url,
      username: siteData.username,
      password: siteData.password,
      captchaType: siteData.captchaType || '无',
      cookies: siteData.cookies,
    };

    // 创建浏览器实例来检查状态
    const browser = new PersistentBrowser();
    
    try {
      // 启动浏览器连接到现有会话
      await browser.launch({ headless: true });

      // 检查登录状态
      const isLoggedIn = await browser.isLoggedIn();
      
      if (isLoggedIn) {
        // 保存会话
        const sessionId = await browser.saveSession(loginSite);
        
        // 获取 cookies
        const context = browser.getContext();
        const cookies = context ? await context.cookies() : [];
        const cookiesString = JSON.stringify(cookies);

        // 更新数据库状态
        await updateSiteStatus(siteId, '已登录', cookiesString);

        await browser.close();

        return NextResponse.json({
          success: true,
          message: `${loginSite.name} 登录状态已确认并保存`,
          data: {
            siteId,
            siteName: loginSite.name,
            status: '已登录',
            sessionId: sessionId,
            cookiesCount: cookies.length,
            timestamp: new Date().toISOString(),
          }
        });
      } else {
        await browser.close();
        
        return NextResponse.json({
          success: false,
          message: `${loginSite.name} 登录状态确认失败，请重新登录`,
          data: {
            siteId,
            siteName: loginSite.name,
            status: '未登录',
            timestamp: new Date().toISOString(),
          }
        });
      }

    } catch (error) {
      console.error('确认登录状态失败:', error);
      
      try {
        await browser.close();
      } catch (closeError) {
        console.error('关闭浏览器失败:', closeError);
      }

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '确认登录状态失败'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('确认登录完成API失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '确认登录完成失败'
    }, { status: 500 });
  }
}
