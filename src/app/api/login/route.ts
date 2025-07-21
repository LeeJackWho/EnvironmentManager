import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { SmartAutoLogin, LoginSite } from '@/lib/playwright-login';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

/**
 * 执行智能自动登录
 * 使用 Playwright 进行真实的自动化登录
 */
async function performAutoLogin(siteData: Record<string, any>) {
  console.log(`🚀 开始智能自动登录: ${siteData.name}`);
  console.log(`🌐 URL: ${siteData.url}`);
  console.log(`👤 用户名: ${siteData.username}`);
  console.log(`🔐 验证码类型: ${siteData.captchaType}`);

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

  // 创建智能自动登录实例
  const autoLogin = new SmartAutoLogin();

  try {
    // 执行自动登录
    const result = await autoLogin.login(loginSite);

    if (result.success) {
      // 将 Cookie 数组转换为字符串存储
      const cookiesString = result.cookies ? JSON.stringify(result.cookies) : '';

      console.log(`✅ 自动登录成功: ${siteData.name}`);
      return {
        success: true,
        message: result.message,
        cookies: cookiesString,
        status: '已登录',
        screenshots: result.screenshots,
      };
    } else {
      console.log(`❌ 自动登录失败: ${siteData.name} - ${result.error}`);
      return {
        success: false,
        message: result.message,
        error: result.error,
        cookies: null,
        status: '登录失败',
        screenshots: result.screenshots,
      };
    }
  } catch (error) {
    console.error(`💥 自动登录异常: ${siteData.name}`, error);
    return {
      success: false,
      message: `${siteData.name} 登录异常`,
      error: error instanceof Error ? error.message : String(error),
      cookies: null,
      status: '登录失败',
    };
  }
}

/**
 * 更新 Notion 数据库中的登录状态
 */
async function updateSiteStatus(pageId: string, status: string, cookies?: string) {
  try {
    const updateData: Record<string, any> = {
      properties: {
        'Status': {
          status: {
            name: status
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

    // 添加最后更新时间
    updateData.properties['LastUpdate'] = {
      date: {
        start: new Date().toISOString()
      }
    };

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
 * 获取网站信息
 */
async function getSiteById(siteId: string) {
  try {
    const response = await notion.pages.retrieve({ page_id: siteId });
    const properties = (response as Record<string, any>).properties;

    return {
      id: response.id,
      name: properties['Name']?.title[0]?.plain_text || '未命名网站',
      url: properties['URL']?.url || '',
      username: properties['Username']?.rich_text[0]?.plain_text || '',
      password: properties['Password']?.rich_text[0]?.plain_text || '',
      captchaType: properties['CaptchaType']?.select?.name || '无',
      status: properties['Status']?.select?.name || '未登录',
      environment: properties['Category']?.select?.name || '测试环境',
    };
  } catch (error) {
    console.error('获取网站信息失败:', error);
    return null;
  }
}

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

    // 获取网站信息
    const siteData = await getSiteById(siteId);
    if (!siteData) {
      return NextResponse.json({
        success: false,
        error: '网站信息不存在'
      }, { status: 404 });
    }

    // 执行自动登录
    const loginResult = await performAutoLogin(siteData);

    // 更新数据库状态
    const updateSuccess = await updateSiteStatus(
      siteId, 
      loginResult.status, 
      loginResult.cookies || undefined
    );

    if (!updateSuccess) {
      return NextResponse.json({
        success: false,
        error: '登录完成但状态更新失败'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: loginResult.message,
      data: {
        siteId,
        siteName: siteData.name,
        status: loginResult.status,
        loginSuccess: loginResult.success,
        timestamp: new Date().toISOString(),
        screenshots: loginResult.screenshots || [],
        cookiesCount: loginResult.cookies ? JSON.parse(loginResult.cookies).length : 0,
      }
    });

  } catch (error) {
    console.error('自动登录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '自动登录失败'
    }, { status: 500 });
  }
}
