import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { SessionManager } from '@/lib/session-manager';
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
        'LastCheck': {
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
 * 检查网站登录状态 API
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
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({
        success: false,
        error: '缺少网站ID参数'
      }, { status: 400 });
    }

    console.log(`🔍 开始检查网站登录状态: ${siteId}`);

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

    // 创建会话管理器
    const sessionManager = new SessionManager();
    
    // 检查登录状态
    const statusResult = await sessionManager.checkLoginStatus(loginSite);

    // 更新数据库状态
    const newStatus = statusResult.status.isLoggedIn ? '已登录' : '未登录';
    const cookiesString = statusResult.status.cookies ? JSON.stringify(statusResult.status.cookies) : undefined;
    
    const updateSuccess = await updateSiteStatus(
      siteId, 
      newStatus,
      cookiesString
    );

    if (!updateSuccess) {
      console.warn('状态检查完成但数据库更新失败');
    }

    return NextResponse.json({
      success: statusResult.success,
      isLoggedIn: statusResult.status.isLoggedIn,
      message: statusResult.message,
      data: {
        siteId,
        siteName: siteData.name,
        status: newStatus,
        lastCheck: statusResult.status.lastCheck,
        needsRelogin: statusResult.needsRelogin || false,
        cookiesCount: statusResult.status.cookies ? statusResult.status.cookies.length : 0,
        error: statusResult.status.error,
      }
    });

  } catch (error) {
    console.error('检查登录状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '检查登录状态失败'
    }, { status: 500 });
  }
}

/**
 * 维护会话状态 API
 */
export async function PUT(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少 Notion API 配置，请检查环境变量'
      }, { status: 500 });
    }

    const body = await request.json();
    const { siteId, action = 'maintain' } = body;

    if (!siteId) {
      return NextResponse.json({
        success: false,
        error: '缺少网站ID参数'
      }, { status: 400 });
    }

    console.log(`🔄 开始维护会话状态: ${siteId}, 操作: ${action}`);

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

    // 创建会话管理器
    const sessionManager = new SessionManager();
    
    let result;
    switch (action) {
      case 'maintain':
        result = await sessionManager.maintainSession(loginSite);
        break;
      case 'refresh':
        result = await sessionManager.refreshCookies(loginSite);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的操作类型'
        }, { status: 400 });
    }

    // 更新数据库状态
    const newStatus = result.status.isLoggedIn ? '已登录' : '未登录';
    const cookiesString = result.status.cookies ? JSON.stringify(result.status.cookies) : undefined;
    
    const updateSuccess = await updateSiteStatus(
      siteId, 
      newStatus,
      cookiesString
    );

    if (!updateSuccess) {
      console.warn('会话维护完成但数据库更新失败');
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        siteId,
        siteName: siteData.name,
        status: newStatus,
        lastCheck: result.status.lastCheck,
        needsRelogin: result.needsRelogin || false,
        cookiesCount: result.status.cookies ? result.status.cookies.length : 0,
        action,
        error: result.status.error,
      }
    });

  } catch (error) {
    console.error('维护会话状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '维护会话状态失败'
    }, { status: 500 });
  }
}
