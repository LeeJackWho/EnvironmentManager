'use client';

import { useState } from 'react';
import { FiRefreshCw, FiMonitor, FiInfo, FiArrowLeft, FiCheck } from 'react-icons/fi';
import Link from 'next/link';

export default function PersistentLoginDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [testSite, setTestSite] = useState({
    name: '测试网站',
    url: 'https://example.com/login',
    username: 'test@example.com',
    password: 'password123'
  });

  const handleTestPersistentLogin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 模拟一个测试网站ID
      const testSiteId = 'test-site-' + Date.now();

      const response = await fetch('/api/persistent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: testSiteId }),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || '测试失败');
      }
    } catch (err) {
      setError('请求失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleGetSessionStatus = async () => {
    try {
      const response = await fetch('/api/persistent-login');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('获取会话状态失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">持久化登录调试工具</h1>
            <Link
              href="/debug"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiArrowLeft size={16} />
              返回调试工具
            </Link>
          </div>

          {/* 说明信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiInfo className="text-blue-600 mt-1 mr-3" />
              <div className="text-blue-800">
                <h3 className="font-medium mb-2">功能说明</h3>
                <ul className="text-sm space-y-1">
                  <li>• 启动独立的浏览器进程，不受主程序影响</li>
                  <li>• 自动导航到登录页面并尝试自动登录</li>
                  <li>• 自动填写用户名和密码</li>
                  <li>• 自动点击登录按钮</li>
                  <li>• 处理验证码（等待手动输入）</li>
                  <li>• 即使关闭环境管理系统，浏览器也会继续运行</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 测试网站配置 */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">测试网站配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站名称
                </label>
                <input
                  type="text"
                  value={testSite.name}
                  onChange={(e) => setTestSite({ ...testSite, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  登录页面URL
                </label>
                <input
                  type="url"
                  value={testSite.url}
                  onChange={(e) => setTestSite({ ...testSite, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={testSite.username}
                  onChange={(e) => setTestSite({ ...testSite, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={testSite.password}
                  onChange={(e) => setTestSite({ ...testSite, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleTestPersistentLogin}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiMonitor />
              )}
              {loading ? '启动中...' : '启动持久化登录测试'}
            </button>

            <button
              onClick={handleGetSessionStatus}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiInfo />
              获取会话状态
            </button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">
                <h3 className="font-medium mb-2">错误信息</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* 结果显示 */}
          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">执行结果</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
