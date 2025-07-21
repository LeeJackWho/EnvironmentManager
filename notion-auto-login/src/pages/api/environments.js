import { getAllSites } from '../../lib/notion.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 获取所有网站数据
    const sites = await getAllSites();
    
    // 提取所有环境分类
    const environments = [...new Set(sites.map(site => site.environment))].filter(Boolean);
    
    // 统计每个环境的网站数量
    const environmentStats = environments.map(env => ({
      name: env,
      count: sites.filter(site => site.environment === env).length,
      sites: sites.filter(site => site.environment === env).map(site => ({
        id: site.id,
        name: site.name,
        status: site.status
      }))
    }));

    res.status(200).json({ 
      success: true, 
      environments: environmentStats,
      total: sites.length
    });
  } catch (error) {
    console.error('获取环境列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取环境列表失败' 
    });
  }
}
