'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiInfo, FiArrowLeft, FiMonitor } from 'react-icons/fi';
import Link from 'next/link';

export default function TestPersistentLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [testSiteId, setTestSiteId] = useState('test-site-baidu');

  const handleTestPersistentLogin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 测试持久化登录功能...');

      const response = await fetch('/api/persistent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: testSiteId }),
      });

      const data = await response.json();
      console.log('📊 测试结果:', data);

      setResult(data);

      if (!data.success) {
        setError(data.error || '测试失败');
      }
    } catch (err) {
      console.error('❌ 测试请求失败:', err);
      setError('请求失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiMonitor className="mr-3 text-blue-600" />
              持久化登录功能测试
            </h1>
            <Link
              href="/debug"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiArrowLeft size={16} />
              返回调试工具
            </Link>
          </div>

          {/* 功能说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiInfo className="text-blue-600 mt-1 mr-3" />
              <div className="text-blue-800">
                <h3 className="font-medium mb-2">测试说明</h3>
                <ul className="text-sm space-y-1">
                  <li>• 🧪 这个测试使用模拟的网站数据</li>
                  <li>• 🚀 测试完整的持久化登录流程</li>
                  <li>• 🔍 验证自动元素识别和填写功能</li>
                  <li>• 🌐 浏览器会保持独立运行</li>
                  <li>• 📊 显示详细的执行结果和日志</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 测试配置 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试网站ID
            </label>
            <select
              value={testSiteId}
              onChange={(e) => setTestSiteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="test-site-baidu">测试网站 - 百度登录</option>
              <option value="test-site-github">测试网站 - GitHub登录</option>
              <option value="test-site-weibo">测试网站 - 微博登录</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              选择不同的测试网站来验证自动登录功能
            </p>
          </div>

          {/* 测试按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleTestPersistentLogin}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiMonitor />
              )}
              {loading ? '测试中...' : '开始测试持久化登录'}
            </button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiX className="text-red-600 mt-1 mr-3" />
                <div className="text-red-800">
                  <h3 className="font-medium mb-2">错误信息</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 成功结果 */}
          {result && result.success && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiCheck className="text-green-600 mt-1 mr-3" />
                  <div className="text-green-800">
                    <h3 className="font-medium mb-2">测试成功</h3>
                    <p className="text-sm mb-3">{result.message}</p>
                    
                    {result.data?.instructions && (
                      <div>
                        <h4 className="font-medium mb-2">执行结果：</h4>
                        <ul className="text-sm space-y-1">
                          {result.data.instructions.map((instruction: string, index: number) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              {result.data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 会话信息 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3">会话信息</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>网站名称:</strong> {result.data.siteName}</p>
                      <p><strong>会话ID:</strong> {result.data.sessionId}</p>
                      <p><strong>时间:</strong> {result.data.timestamp}</p>
                    </div>
                  </div>

                  {/* 登录结果 */}
                  {result.data.loginResult && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-medium text-purple-900 mb-3">登录结果</h3>
                      <div className="text-sm text-purple-800 space-y-1">
                        <p><strong>自动登录:</strong> {result.data.loginResult.success ? '成功' : '失败'}</p>
                        <p><strong>登录状态:</strong> {result.data.loginResult.isLoggedIn ? '已登录' : '未登录'}</p>
                        <p><strong>需要手动操作:</strong> {result.data.loginResult.needsManualAction ? '是' : '否'}</p>
                        <p><strong>消息:</strong> {result.data.loginResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 失败结果 */}
          {result && !result.success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <FiX className="text-red-600 mt-1 mr-3" />
                <div className="text-red-800">
                  <h3 className="font-medium mb-2">测试失败</h3>
                  <p className="text-sm">{result.message || result.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">使用说明</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. 选择要测试的网站类型</li>
              <li>2. 点击"开始测试持久化登录"</li>
              <li>3. 观察浏览器窗口的自动操作过程</li>
              <li>4. 查看测试结果和详细信息</li>
              <li>5. 浏览器会保持运行，您可以手动完成剩余步骤</li>
              <li>6. 即使关闭这个页面，浏览器也会继续运行</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
