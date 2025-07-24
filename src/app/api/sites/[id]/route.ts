import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { checkEnvConfig, debugEnvVars } from '@/lib/env';

/**
 * 更新网站配置 API
 */
export async function PUT(
  request: NextRequest,
  segmentData: any
) {
  try {
    // 检查环境变量
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少环境变量配置'
      }, { status: 500 });
    }

    const { id } = segmentData.params;
    const body = await request.json();
    const { name, url, username, password, environment, captchaType, notes } = body;

    // 验证必需字段
    if (!name || !url || !username || !environment) {
      return NextResponse.json({
        success: false,
        error: '缺少必需字段'
      }, { status: 400 });
    }

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
      timeoutMs: 30000, // 增加超时时间到30秒
    });

    console.log(`🔄 更新网站配置: ${name} (ID: ${id})`);

    // 构建更新数据
    const updateData: any = {
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
      'Description': {
        rich_text: [
          {
            text: {
              content: notes || ''
            }
          }
        ]
      }
    };

    // 只有提供密码时才更新密码字段
    if (password && password.trim() !== '') {
      updateData['Password'] = {
        rich_text: [
          {
            text: {
              content: password
            }
          }
        ]
      };
    }

    // 更新 Notion 页面
    const response = await notion.pages.update({
      page_id: id,
      properties: updateData
    });

    console.log('✅ 网站配置更新成功');

    return NextResponse.json({
      success: true,
      message: '网站配置更新成功',
      data: {
        id: response.id,
        name,
        url,
        username,
        environment,
        captchaType,
        notes
      }
    });

  } catch (error: any) {
    console.error('❌ 更新网站配置失败:', error);
    
    let errorMessage = '更新网站配置失败';
    if (error.code === 'object_not_found') {
      errorMessage = '网站配置不存在';
    } else if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 权限不足';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}

/**
 * 删除网站配置 API
 */
export async function DELETE(
  request: NextRequest,
  segmentData: any
) {
  try {
    // 调试环境变量
    debugEnvVars();

    // 检查环境变量配置
    const envConfig = checkEnvConfig();

    if (!envConfig.isValid) {
      console.error('❌ 删除网站 - 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '缺少环境变量配置',
        details: {
          errors: envConfig.errors
        }
      }, { status: 500 });
    }

    const { apiKey } = envConfig;
    const { id } = segmentData.params;

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: apiKey,
      timeoutMs: 30000, // 增加超时时间到30秒
    });

    console.log(`🗑️ 禁用网站配置 (ID: ${id})`);

    // 由于没有删除权限，我们将状态设置为"禁用"来实现软删除
    await notion.pages.update({
      page_id: id,
      properties: {
        'Status': {
          status: {
            name: '禁用'
          }
        }
      }
    });

    console.log('✅ 网站配置已禁用');

    return NextResponse.json({
      success: true,
      message: '网站配置已禁用'
    });

  } catch (error: any) {
    console.error('❌ 删除网站配置失败:', error);
    
    let errorMessage = '禁用网站配置失败';
    if (error.code === 'object_not_found') {
      errorMessage = '网站配置不存在';
    } else if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 权限不足';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}

/**
 * 获取单个网站配置 API
 */
export async function GET(
  request: NextRequest,
  segmentData: any
) {
  try {
    // 检查环境变量
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少环境变量配置'
      }, { status: 500 });
    }

    const { id } = segmentData.params;

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
      timeoutMs: 30000, // 增加超时时间到30秒
    });

    console.log(`📖 获取网站配置 (ID: ${id})`);

    // 获取页面信息
    const page = await notion.pages.retrieve({ page_id: id });
    
    if (!('properties' in page)) {
      throw new Error('页面数据格式错误');
    }

    const properties = page.properties as Record<string, any>;

    // 转换数据格式
    const site = {
      id: page.id,
      name: properties['Name']?.title?.[0]?.text?.content || '',
      url: properties['URL']?.url || '',
      username: properties['Username']?.rich_text?.[0]?.text?.content || '',
      password: properties['Password']?.rich_text?.[0]?.text?.content || '',
      environment: properties['Category']?.select?.name || '',
      captchaType: properties['CaptchaType']?.select?.name || '',
      status: properties['Status']?.select?.name || '未登录',
      notes: properties['Description']?.rich_text?.[0]?.text?.content || '',
      cookies: properties['Cookies']?.rich_text?.[0]?.text?.content || null
    };

    console.log('✅ 网站配置获取成功');

    return NextResponse.json({
      success: true,
      data: site
    });

  } catch (error: any) {
    console.error('❌ 获取网站配置失败:', error);
    
    let errorMessage = '获取网站配置失败';
    if (error.code === 'object_not_found') {
      errorMessage = '网站配置不存在';
    } else if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 权限不足';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}
