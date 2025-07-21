import { getSiteById, updateSiteStatus } from '../../lib/notion.js';
import { autoLogin } from '../../lib/playwright.js';
import { formatCookiesForStorage } from '../../lib/session.js';

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

    // 执行自动登录
    console.log(`开始为网站 ${site.name} 执行自动登录...`);
    const loginResult = await autoLogin(site);

    if (loginResult.success) {
      // 登录成功，更新Notion中的状态
      const cookiesString = formatCookiesForStorage(loginResult.cookies);
      await updateSiteStatus(siteId, '已登录', loginResult.cookies);

      res.status(200).json({
        success: true,
        message: '登录成功',
        site: {
          id: siteId,
          name: site.name,
          status: '已登录',
          lastLogin: new Date().toISOString(),
        },
      });
    } else {
      // 登录失败，更新状态
      await updateSiteStatus(siteId, '登录失败', null, loginResult.error);

      res.status(400).json({
        success: false,
        error: loginResult.error || '登录失败',
        site: {
          id: siteId,
          name: site.name,
          status: '登录失败',
        },
      });
    }
  } catch (error) {
    console.error('登录API错误:', error);
    
    // 更新失败状态
    try {
      await updateSiteStatus(siteId, '登录失败', null, error.message);
    } catch (updateError) {
      console.error('更新状态失败:', updateError);
    }

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
}

// 设置API路由超时时间（Vercel默认10秒，这里设置为最大值）
export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 60, // 60秒超时
};
