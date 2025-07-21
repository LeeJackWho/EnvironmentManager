import { Client } from '@notionhq/client';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * 获取所有网站信息
 */
export async function getAllSites(environment = null) {
  try {
    const queryOptions = {
      database_id: databaseId,
      sorts: [
        {
          property: '网站名称',
          direction: 'ascending',
        },
      ],
    };

    // 如果指定了环境，添加过滤条件
    if (environment) {
      queryOptions.filter = {
        property: '环境分类',
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
export async function getSiteById(pageId) {
  try {
    const response = await notion.pages.retrieve({
      page_id: pageId,
    });

    return formatSite(response);
  } catch (error) {
    console.error(`获取网站信息失败 (ID: ${pageId}):`, error);
    return null;
  }
}

/**
 * 更新网站登录状态
 */
export async function updateSiteStatus(pageId, status, cookies = null, error = null) {
  try {
    const properties = {
      '登录状态': {
        select: {
          name: status,
        },
      },
    };

    if (status === '已登录') {
      properties['上次登录'] = {
        date: {
          start: new Date().toISOString(),
        },
      };

      if (cookies) {
        properties['Cookie数据'] = {
          rich_text: [
            {
              text: {
                content: JSON.stringify(cookies),
              },
            },
          ],
        };
      }
    }

    if (error) {
      properties['备注'] = {
        rich_text: [
          {
            text: {
              content: `登录失败: ${error}`,
            },
          },
        ],
      };
    }

    await notion.pages.update({
      page_id: pageId,
      properties,
    });

    return true;
  } catch (error) {
    console.error(`更新网站状态失败 (ID: ${pageId}):`, error);
    return false;
  }
}

/**
 * 格式化 Notion 页面数据
 */
function formatSite(page) {
  const properties = page.properties;

  return {
    id: page.id,
    name: properties['网站名称']?.title[0]?.plain_text || '未命名网站',
    url: properties['网站链接']?.url || '',
    username: properties['用户名']?.rich_text[0]?.plain_text || '',
    password: properties['密码']?.rich_text[0]?.plain_text || '',
    captchaType: properties['验证码类型']?.select?.name || '无',
    status: properties['登录状态']?.select?.name || '未登录',
    environment: properties['环境分类']?.select?.name || '测试环境',
    cookies: properties['Cookie数据']?.rich_text[0]?.plain_text || null,
    notes: properties['备注']?.rich_text[0]?.plain_text || '',
  };
}
