import { NextResponse } from 'next/server';
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
    status: properties['Status']?.status?.name || properties['Status']?.select?.name || '未登录',
    environment: properties['Category']?.select?.name || '测试环境',
    cookies: properties['Cookies']?.rich_text[0]?.plain_text || null,
    notes: properties['Description']?.rich_text[0]?.plain_text || '',
  };
}

/**
 * 获取所有启用状态的网站信息
 */
async function getAllSites(apiKey: string, databaseId: string, environment?: string) {
  try {
    // 初始化 Notion 客户端
    const notion = new Client({
      auth: apiKey,
      timeoutMs: 15000,
    });

    // 构建过滤条件 - 只获取启用状态的网站
    let filter: any = {
      property: 'Status',
      status: {
        equals: '启用'
      }
    };

    // 如果指定了环境，添加环境过滤
    if (environment) {
      filter = {
        and: [
          {
            property: 'Status',
            status: {
              equals: '启用'
            }
          },
          {
            property: 'Category',
            select: {
              equals: environment,
            }
          }
        ]
      };
    }

    const queryOptions = {
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

    return response.results.map((page) => formatSite(page));
  } catch (error) {
    console.error('获取网站列表失败:', error);
    return [];
  }
}

export async function GET() {
  try {
    // 调试环境变量
    debugEnvVars();

    // 检查环境变量配置
    const envConfig = checkEnvConfig();

    if (!envConfig.isValid) {
      console.error('❌ 获取环境统计 - 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '缺少 Notion API 配置，请检查环境变量',
        details: {
          errors: envConfig.errors
        }
      }, { status: 500 });
    }

    const { apiKey, databaseId } = envConfig;

    // 获取所有启用状态的网站数据
    const sites = await getAllSites(apiKey!, databaseId!);

    // 获取数据库字段选项（包含颜色信息）
    const notion = new Client({
      auth: apiKey!,
      timeoutMs: 15000,
    });

    const databaseInfo = await notion.databases.retrieve({
      database_id: databaseId!
    });

    // 获取Category字段的选项和颜色
    const categoryField = databaseInfo.properties['Category'];
    const categoryOptions: Record<string, string> = {};

    if (categoryField && categoryField.type === 'select' && categoryField.select?.options) {
      categoryField.select.options.forEach((option: any) => {
        categoryOptions[option.name] = option.color;
      });
    }

    // 提取所有环境分类
    const environments = [...new Set(sites.map(site => site.environment))].filter(Boolean);

    // 统计每个环境的网站数量，并添加颜色信息
    const environmentStats = environments.map(env => ({
      name: env,
      color: categoryOptions[env] || 'gray', // 默认颜色为灰色
      count: sites.filter(site => site.environment === env).length,
      sites: sites.filter(site => site.environment === env).map(site => ({
        id: site.id,
        name: site.name,
        status: site.status
      }))
    }));

    return NextResponse.json({ 
      success: true, 
      environments: environmentStats,
      total: sites.length
    });
  } catch (error) {
    console.error('获取环境列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取环境列表失败'
    }, { status: 500 });
  }
}
