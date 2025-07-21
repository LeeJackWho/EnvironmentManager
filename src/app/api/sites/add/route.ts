import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { checkEnvConfig, debugEnvVars } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // 调试环境变量
    debugEnvVars();

    // 检查环境变量配置
    const envConfig = checkEnvConfig();

    if (!envConfig.isValid) {
      console.error('❌ 添加网站 - 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '缺少 Notion API 配置，请检查环境变量',
        details: {
          errors: envConfig.errors,
          hasApiKey: !!envConfig.apiKey,
          hasDatabaseId: !!envConfig.databaseId
        }
      }, { status: 500 });
    }

    const { apiKey, databaseId } = envConfig;

    const body = await request.json();
    const { 
      name, 
      url, 
      username, 
      password, 
      environment, 
      captchaType = '无',
      notes = '' 
    } = body;

    console.log('📝 添加网站配置:', {
      name,
      url,
      username: username ? '***' : undefined,
      password: password ? '***' : undefined,
      environment,
      captchaType,
      notes: notes ? notes.substring(0, 50) + '...' : ''
    });

    // 验证必填字段
    if (!name || !url || !username || !password || !environment) {
      return NextResponse.json({
        success: false,
        error: '请填写所有必填字段：网站名称、网站链接、用户名、密码、环境分类'
      }, { status: 400 });
    }

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: apiKey,
      timeoutMs: 15000,
    });

    console.log('🔗 创建 Notion 页面...');

    // 创建新的 Notion 页面
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: {
        'Name': {
          title: [
            {
              text: {
                content: name
              }
            }
          ]
        },
        'URL': {
          url: url
        },
        'Username': {
          rich_text: [
            {
              text: {
                content: username
              }
            }
          ]
        },
        'Password': {
          rich_text: [
            {
              text: {
                content: password
              }
            }
          ]
        },
        'Category': {
          select: {
            name: environment
          }
        },
        'CaptchaType': {
          select: {
            name: captchaType
          }
        },
        'Status': {
          status: {
            name: '启用'
          }
        },
        'Description': {
          rich_text: [
            {
              text: {
                content: notes
              }
            }
          ]
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '网站配置添加成功',
      data: {
        id: response.id,
        name,
        url,
        username,
        environment,
        captchaType,
        status: '未登录',
        notes
      }
    });

  } catch (error: unknown) {
    console.error('❌ 添加网站配置失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));

    // 处理 Notion API 错误
    const err = error as Record<string, any>;
    if (err.code === 'object_not_found') {
      return NextResponse.json({
        success: false,
        error: '数据库不存在或无权限访问，请检查 NOTION_DATABASE_ID 配置'
      }, { status: 404 });
    }

    if (err.code === 'unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Notion API 密钥无效或无权限，请检查 NOTION_API_KEY 配置'
      }, { status: 401 });
    }

    if (err.code === 'validation_error') {
      return NextResponse.json({
        success: false,
        error: `数据库字段配置错误: ${err.message}`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: err.message || '添加网站配置失败',
      details: {
        code: err.code,
        body: err.body,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    }, { status: 500 });
  }
}
