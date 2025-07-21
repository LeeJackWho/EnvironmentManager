import { Client } from '@notionhq/client';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 15000,
});

const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * 获取环境信息（通过网站ID）
 */
export async function getEnvironmentById(siteId: string): Promise<any | null> {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('缺少 Notion API Key');
    }

    console.log(`🔍 获取网站信息: ${siteId}`);

    // 直接通过页面ID获取网站信息
    const response = await notion.pages.retrieve({
      page_id: siteId,
    });

    if (!('properties' in response)) {
      throw new Error('页面数据格式错误');
    }

    const site = formatSite(response);
    console.log(`✅ 网站信息获取成功: ${site.name}`);
    return site;
  } catch (error: any) {
    console.error(`❌ 获取网站信息失败 (ID: ${siteId}):`, error);

    // 如果是页面不存在的错误，返回null
    if (error.code === 'object_not_found') {
      console.log(`⚠️ 网站不存在: ${siteId}`);
      return null;
    }

    // 其他错误也返回null，避免阻塞
    return null;
  }
}

/**
 * 获取所有网站信息
 */
export async function getAllSites(environment?: string): Promise<any[]> {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      throw new Error('缺少 Notion 配置');
    }

    const queryOptions: any = {
      database_id: databaseId!,
      sorts: [
        {
          property: 'Name',
          direction: 'ascending',
        },
      ],
    };

    // 如果指定了环境，添加过滤条件
    if (environment) {
      queryOptions.filter = {
        property: 'Category',
        select: {
          equals: environment,
        },
      };
    }

    const response = await notion.databases.query(queryOptions);
    return response.results.map((page) => formatSite(page));
  } catch (error) {
    console.error('获取网站列表失败:', error);
    return [];
  }
}

/**
 * 获取单个网站信息
 */
export async function getSiteById(pageId: string): Promise<any | null> {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('缺少 Notion API Key');
    }

    const response = await notion.pages.retrieve({
      page_id: pageId,
    });

    if (!('properties' in response)) {
      throw new Error('页面数据格式错误');
    }

    return formatSite(response);
  } catch (error) {
    console.error(`获取网站信息失败 (ID: ${pageId}):`, error);
    return null;
  }
}

/**
 * 更新网站状态
 */
export async function updateSiteStatus(
  pageId: string, 
  status: string, 
  cookies?: string
): Promise<boolean> {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('缺少 Notion API Key');
    }

    const updateData: any = {
      page_id: pageId,
      properties: {
        Status: {
          status: {
            name: status
          }
        }
      }
    };

    // 如果提供了 cookies，也更新 cookies 字段
    if (cookies) {
      updateData.properties.Cookies = {
        rich_text: [
          {
            text: {
              content: cookies
            }
          }
        ]
      };
    }

    await notion.pages.update(updateData);
    console.log(`✅ 更新网站状态成功: ${pageId} -> ${status}`);
    return true;
  } catch (error) {
    console.error(`更新网站状态失败 (ID: ${pageId}):`, error);
    return false;
  }
}

/**
 * 添加新网站
 */
export async function addSite(siteData: any): Promise<any | null> {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      throw new Error('缺少 Notion 配置');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId!
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: siteData.name
              }
            }
          ]
        },
        URL: {
          url: siteData.url
        },
        Username: {
          rich_text: [
            {
              text: {
                content: siteData.username
              }
            }
          ]
        },
        Password: {
          rich_text: [
            {
              text: {
                content: siteData.password
              }
            }
          ]
        },
        Category: {
          select: {
            name: siteData.environment || '测试环境'
          }
        },
        CaptchaType: {
          select: {
            name: siteData.captchaType || '无'
          }
        },
        Status: {
          status: {
            name: '启用'
          }
        },
        Description: {
          rich_text: [
            {
              text: {
                content: siteData.notes || ''
              }
            }
          ]
        }
      }
    });

    return formatSite(response);
  } catch (error) {
    console.error('添加网站失败:', error);
    return null;
  }
}

/**
 * 格式化 Notion 页面数据
 */
function formatSite(page: any): any {
  const properties = page.properties;

  return {
    id: page.id,
    name: properties['Name']?.title?.[0]?.plain_text || '未命名网站',
    url: properties['URL']?.url || '',
    username: properties['Username']?.rich_text?.[0]?.plain_text || '',
    password: properties['Password']?.rich_text?.[0]?.plain_text || '',
    captchaType: properties['CaptchaType']?.select?.name || '无',
    status: properties['Status']?.status?.name || '未登录',
    environment: properties['Category']?.select?.name || '测试环境',
    cookies: properties['Cookies']?.rich_text?.[0]?.plain_text || null,
    notes: properties['Description']?.rich_text?.[0]?.plain_text || '',
  };
}

/**
 * 获取环境统计
 */
export async function getEnvironmentStats(): Promise<any> {
  try {
    const sites = await getAllSites();
    
    const stats: any = {
      total: sites.length,
      environments: {},
      statuses: {}
    };

    sites.forEach(site => {
      // 环境统计
      const env = site.environment || '未分类';
      if (!stats.environments[env]) {
        stats.environments[env] = 0;
      }
      stats.environments[env]++;

      // 状态统计
      const status = site.status || '未知';
      if (!stats.statuses[status]) {
        stats.statuses[status] = 0;
      }
      stats.statuses[status]++;
    });

    return stats;
  } catch (error) {
    console.error('获取环境统计失败:', error);
    return {
      total: 0,
      environments: {},
      statuses: {}
    };
  }
}
