import { getAllSites } from '../../lib/notion.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 从查询参数获取环境过滤条件
    const { environment } = req.query;

    const sites = await getAllSites(environment);
    res.status(200).json({
      success: true,
      sites,
      environment: environment || '全部环境'
    });
  } catch (error) {
    console.error('获取网站列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取网站列表失败'
    });
  }
}
