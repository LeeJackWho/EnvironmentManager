import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

/**
 * 测试 Notion 连接API
 * 用于验证 API Key 和数据库 ID 是否有效
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, databaseId } = body;

    if (!apiKey || !databaseId) {
      return NextResponse.json({
        success: false,
        error: '缺少 API Key 或数据库 ID'
      }, { status: 400 });
    }

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: apiKey,
      timeoutMs: 10000,
    });

    console.log('🔍 开始测试 Notion 连接...');

    // 测试 1: 验证 API Key
    try {
      await notion.users.me();
      console.log('✅ API Key 验证成功');
    } catch (error: any) {
      console.error('❌ API Key 验证失败:', error);
      if (error.code === 'unauthorized') {
        return NextResponse.json({
          success: false,
          error: 'API Key 无效或已过期',
          details: { step: 'api_key_validation', code: error.code }
        }, { status: 401 });
      }
      throw error;
    }

    // 测试 2: 验证数据库访问权限
    let databaseInfo;
    try {
      databaseInfo = await notion.databases.retrieve({
        database_id: databaseId
      });
      console.log('✅ 数据库访问成功');
    } catch (error: any) {
      console.error('❌ 数据库访问失败:', error);
      if (error.code === 'object_not_found') {
        return NextResponse.json({
          success: false,
          error: '数据库不存在或 Integration 没有访问权限',
          details: { 
            step: 'database_access', 
            code: error.code,
            suggestion: '请确保已将 Integration 添加到数据库的连接中'
          }
        }, { status: 404 });
      }
      throw error;
    }

    // 测试 3: 检查数据库结构
    const properties = databaseInfo.properties;
    const requiredFields = ['Name', 'URL', 'Username', 'Password', 'Category'];
    const missingFields = requiredFields.filter(field => !properties[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ 数据库缺少必需字段:', missingFields);
    }

    // 测试 4: 尝试查询数据库
    try {
      const queryResult = await notion.databases.query({
        database_id: databaseId,
        page_size: 1
      });
      console.log('✅ 数据库查询成功');
    } catch (error: any) {
      console.error('❌ 数据库查询失败:', error);
      return NextResponse.json({
        success: false,
        error: '数据库查询失败，可能是权限不足',
        details: { 
          step: 'database_query', 
          code: error.code,
          suggestion: '请确保 Integration 有读取数据库的权限'
        }
      }, { status: 403 });
    }

    console.log('✅ Notion 连接测试完成');

    return NextResponse.json({
      success: true,
      message: 'Notion 连接测试成功！所有功能正常。',
      database: {
        title: databaseInfo.title?.[0]?.plain_text || 'Untitled',
        fieldCount: Object.keys(properties).length,
        hasRequiredFields: missingFields.length === 0,
        missingFields: missingFields
      },
      tests: {
        apiKeyValid: true,
        databaseAccessible: true,
        databaseQueryable: true,
        structureComplete: missingFields.length === 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Notion 连接测试失败:', error);
    
    let errorMessage = 'Notion 连接测试失败';
    if (error.code === 'unauthorized') {
      errorMessage = 'API Key 无效或权限不足';
    } else if (error.code === 'object_not_found') {
      errorMessage = '数据库不存在或无权限访问';
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Notion API 连接超时';
    } else if (error.message?.includes('fetch')) {
      errorMessage = '网络连接失败，请检查网络设置';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

/**
 * 使用当前环境变量测试连接
 */
export async function GET() {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
      return NextResponse.json({
        success: false,
        error: '环境变量中缺少 NOTION_API_KEY 或 NOTION_DATABASE_ID'
      }, { status: 400 });
    }

    // 使用 POST 方法的逻辑
    const testResult = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, databaseId })
    }));

    return testResult;

  } catch (error) {
    console.error('❌ 环境变量连接测试失败:', error);
    return NextResponse.json({
      success: false,
      error: '连接测试失败: ' + (error as Error).message
    }, { status: 500 });
  }
}
