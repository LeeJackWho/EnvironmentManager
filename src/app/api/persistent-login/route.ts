import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PersistentSessionManager } from '@/lib/persistent-session';
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
async function updateSiteStatus(pageId: string, status: string, sessionInfo?: string): Promise<boolean> {
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

    if (sessionInfo) {
      updateData.properties['Notes'] = {
        rich_text: [
          {
            text: {
              content: `持久化会话: ${sessionInfo}`
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
 * 启动持久化登录会话 API
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

    console.log(`🎯 启动持久化登录会话: ${siteId}`);

    // 获取网站信息
    let siteData = await getSiteById(siteId);

    // 如果是测试网站ID，创建模拟数据
    if (!siteData && siteId.startsWith('test-site-')) {
      console.log(`🧪 检测到测试网站ID，创建模拟数据: ${siteId}`);

      // 根据不同的测试ID创建不同的测试数据
      const testSites: Record<string, any> = {
        'test-site-baidu': {
          id: siteId,
          name: '百度账号测试',
          url: 'https://passport.baidu.com/v2/?login',
          username: 'test_username',
          password: 'test_password',
          captchaType: '图形',
          cookies: '',
          status: '未登录',
          category: '测试环境',
        },
        'test-site-github': {
          id: siteId,
          name: 'GitHub测试',
          url: 'https://github.com/login',
          username: 'test_user',
          password: 'test_pass123',
          captchaType: '无',
          cookies: '',
          status: '未登录',
          category: '测试环境',
        },
        'test-site-weibo': {
          id: siteId,
          name: '微博测试',
          url: 'https://weibo.com/login.php',
          username: 'test@example.com',
          password: 'password123',
          captchaType: '滑动',
          cookies: '',
          status: '未登录',
          category: '测试环境',
        },
      };

      siteData = testSites[siteId] || {
        id: siteId,
        name: '通用测试网站',
        url: 'https://example.com/login',
        username: 'test@example.com',
        password: 'password123',
        captchaType: '无',
        cookies: '',
        status: '未登录',
        category: '测试环境',
      };
    }

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

    // 创建持久化会话管理器
    const sessionManager = new PersistentSessionManager();
    
    // 启动持久化会话
    const result = await sessionManager.startPersistentSession(loginSite);

    if (result.success) {
      // 根据登录结果更新数据库状态
      const status = result.loginResult?.isLoggedIn ? '已登录' : '会话启动';
      await updateSiteStatus(
        siteId,
        status,
        `SessionID: ${result.sessionId}, 自动登录: ${result.loginResult?.success ? '成功' : '需手动'}`
      );

      // 构建指导信息
      let instructions = [
        '✅ 持久化浏览器会话已启动',
        '🌐 浏览器窗口已打开并导航到登录页面',
      ];

      if (result.loginResult?.success) {
        if (result.loginResult.isLoggedIn) {
          instructions.push('🎉 自动登录成功！');
          instructions.push('🧪 您可以直接在浏览器中进行测试');
        } else if (result.loginResult.needsManualAction) {
          instructions.push('🔐 登录信息已自动填写');
          instructions.push('👆 请在浏览器中完成剩余登录步骤（如验证码）');
        }
      } else {
        instructions.push('⚠️ 自动登录未完全成功');
        instructions.push('🔐 请在浏览器中手动完成登录');
      }

      instructions.push('💪 即使关闭环境管理系统，浏览器也会继续运行');
      instructions.push('🔄 下次启动系统时，会话信息会被保留');

      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          siteId,
          siteName: loginSite.name,
          sessionId: result.sessionId,
          browserInfo: result.browserInfo,
          loginResult: result.loginResult,
          timestamp: new Date().toISOString(),
          instructions
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: '启动持久化会话失败',
        data: {
          siteId,
          siteName: loginSite.name,
          timestamp: new Date().toISOString(),
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('持久化登录API失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '持久化登录失败'
    }, { status: 500 });
  }
}

/**
 * 获取会话状态 API
 */
export async function GET() {
  try {
    const sessionManager = new PersistentSessionManager();
    const stats = sessionManager.getSessionStats();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('获取会话状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取会话状态失败'
    }, { status: 500 });
  }
}

/**
 * 清理会话配置 API
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    const sessionManager = new PersistentSessionManager();
    sessionManager.clearSessionConfig(sessionId);

    return NextResponse.json({
      success: true,
      message: sessionId ? `会话配置已清理: ${sessionId}` : '所有会话配置已清理',
      data: {
        sessionId: sessionId || 'all',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('清理会话配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '清理会话配置失败'
    }, { status: 500 });
  }
}
