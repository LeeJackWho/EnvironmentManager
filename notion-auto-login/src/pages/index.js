import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SiteCard from '../components/SiteCard';

export default function Home() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取网站列表
  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sites');
      const data = await response.json();
      
      if (data.success) {
        setSites(data.sites);
        setError(null);
      } else {
        setError(data.error || '获取网站列表失败');
      }
    } catch (error) {
      setError('请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchSites();
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    fetchSites();
  };

  // 统计信息
  const stats = {
    total: sites.length,
    loggedIn: sites.filter(site => site.status === '已登录').length,
    failed: sites.filter(site => site.status === '登录失败').length,
    notLoggedIn: sites.filter(site => site.status === '未登录').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">总网站数</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.loggedIn}</div>
          <div className="text-sm text-gray-600">已登录</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">登录失败</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.notLoggedIn}</div>
          <div className="text-sm text-gray-600">未登录</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">网站列表</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          刷新
        </button>
      </div>

      {/* 网站列表 */}
      {sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            暂无网站数据，请在 Notion 中添加网站信息
          </div>
          <a
            href="https://notion.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            前往 Notion →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• 在 Notion 数据库中添加网站信息（名称、链接、账号、密码等）</li>
          <li>• 点击"登录"按钮执行自动登录</li>
          <li>• 系统会自动处理验证码并保持登录状态</li>
          <li>• 使用"检查状态"按钮验证登录是否仍然有效</li>
          <li>• 支持图形验证码和滑动验证码自动识别</li>
        </ul>
      </div>
    </Layout>
  );
}
