import { getSiteById, updateSiteStatus } from '../../lib/notion.js';
import { checkLoginStatus, formatCookiesForStorage } from '../../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  const { siteId } = req.body;

  if (!siteId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少网站ID' 
    });
  }

  try {
    // 获取网站信息
    const site = await getSiteById(siteId);
    if (!site) {
      return res.status(404).json({ 
        success: false, 
        error: '网站不存在' 
      });
    }

    // 检查登录状态
    console.log(`检查网站 ${site.name} 的登录状态...`);
    const statusResult = await checkLoginStatus(site);

    if (statusResult.success) {
      if (statusResult.isLoggedIn) {
        // 仍然登录，更新Cookie
        const cookiesString = formatCookiesForStorage(statusResult.cookies);
        await updateSiteStatus(siteId, '已登录', statusResult.cookies);

        res.status(200).json({
          success: true,
          isLoggedIn: true,
          message: '用户已登录',
          site: {
            id: siteId,
            name: site.name,
            status: '已登录',
          },
        });
      } else {
        // 登录已过期
        await updateSiteStatus(siteId, '未登录');

        res.status(200).json({
          success: true,
          isLoggedIn: false,
          message: '登录已过期',
          site: {
            id: siteId,
            name: site.name,
            status: '未登录',
          },
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: statusResult.error || '检查状态失败',
      });
    }
  } catch (error) {
    console.error('检查状态API错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 30,
};
