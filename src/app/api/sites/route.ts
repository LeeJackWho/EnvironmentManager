import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { checkEnvConfig, debugEnvVars } from '@/lib/env';

/**
 * 格式化 Notion 页面数据
 */
function formatSite(page: Record<string, unknown>) {
  const properties = page.properties as Record<string, any>;

  return {
    id: page.id,
    name: properties['Name']?.title[0]?.plain_text || '未命名网站',
    url: properties['URL']?.url || '',
    username: properties['Username']?.rich_text[0]?.plain_text || '',
    password: properties['Password']?.rich_text[0]?.plain_text || '',
    captchaType: properties['CaptchaType']?.select?.name || '无',
    status: properties['Status']?.select?.name || '未登录',
    environment: properties['Category']?.select?.name || '测试环境',
    cookies: properties['Cookies']?.rich_text[0]?.plain_text || null,
    notes: properties['Description']?.rich_text[0]?.plain_text || '',
  };
}

/**
 * 获取所有网站信息（只返回启用状态的网站，带重试机制）
 */
async function getAllSites(apiKey: string, databaseId: string, environment?: string) {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 尝试获取网站列表 (第${attempt}次)`);

      // 初始化 Notion 客户端，每次重试使用更长的超时时间
      const timeoutMs = 10000 + (attempt - 1) * 5000; // 10s, 15s, 20s
      const notion = new Client({
        auth: apiKey,
        timeoutMs,
      });

      // 构建过滤条件 - 只显示启用状态的网站，如果Status字段不存在则显示所有
      let filter: any = {
        or: [
          {
            property: 'Status',
            status: {
              equals: '启用'
            }
          },
          {
            property: 'Status',
            status: {
              is_empty: true
            }
          }
        ]
      };

      // 如果指定了环境，添加环境过滤
      if (environment) {
        filter = {
          and: [
            filter,
            {
              property: 'Category',
              select: {
                equals: environment,
              }
            }
          ]
        };
      }

      const queryOptions: any = {
        database_id: databaseId,
        sorts: [
          {
            property: 'Name',
            direction: 'ascending' as const,
          },
        ],
        filter: filter
      };

      const response = await notion.databases.query(queryOptions);
      const sites = response.results.map((page) => formatSite(page));

      console.log(`✅ 网站列表获取成功 (第${attempt}次): ${sites.length}个网站`);
      return sites;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ 第${attempt}次获取网站列表失败:`, {
        message: error.message,
        code: error.code,
        attempt,
        maxRetries
      });

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败了
  console.error('❌ 所有重试都失败，返回空列表');
  return [];
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 开始获取网站列表...');

    // 检查环境变量配置
    const envConfig = checkEnvConfig();

    if (!envConfig.isValid) {
      console.error('❌ 获取网站列表 - 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '缺少 Notion API 配置，请检查环境变量',
        details: {
          errors: envConfig.errors
        }
      }, { status: 500 });
    }

    const { apiKey, databaseId } = envConfig;

    // 从查询参数获取环境过滤条件
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    console.log(`📋 获取网站列表，环境过滤: ${environment || '全部环境'}`);

    const sites = await getAllSites(apiKey!, databaseId!, environment || undefined);

    const duration = Date.now() - startTime;
    console.log(`✅ 网站列表获取完成 (${duration}ms): ${sites.length}个网站`);

    return NextResponse.json({
      success: true,
      data: sites, // 使用 data 字段保持一致性
      sites, // 保留 sites 字段向后兼容
      environment: environment || '全部环境',
      count: sites.length,
      duration
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ 获取网站列表失败 (${duration}ms):`, error);

    let errorMessage = '获取网站列表失败';
    let statusCode = 500;

    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 密钥无效或权限不足';
      statusCode = 401;
    } else if (error.code === 'object_not_found') {
      errorMessage = '数据库不存在或无权限访问';
      statusCode = 404;
    } else if (error.name === 'TimeoutError' || error.code === 'ECONNRESET') {
      errorMessage = 'Notion API 连接超时，请稍后重试';
      statusCode = 408;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code,
        duration,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: statusCode });
  }
}
