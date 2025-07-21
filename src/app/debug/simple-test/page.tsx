'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function SimpleTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [testUrl, setTestUrl] = useState('https://www.baidu.com');

  const handleSimpleTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 开始简单测试...');

      const response = await fetch('/api/test-persistent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: testUrl,
          username: 'test',
          password: 'test'
        }),
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

  const handleCheckStatus = async () => {
    try {
      const response = await fetch('/api/test-persistent');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('检查状态失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">简单持久化测试</h1>
            <Link
              href="/debug"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiArrowLeft size={16} />
              返回调试工具
            </Link>
          </div>

          {/* 测试说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 这是一个简化的测试，用于验证 Playwright 浏览器启动功能</li>
              <li>• 浏览器会打开指定的网页并保持运行</li>
              <li>• 即使关闭这个页面，浏览器也会继续运行</li>
            </ul>
          </div>

          {/* 测试配置 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试网址
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleSimpleTest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiCheck />
              )}
              {loading ? '测试中...' : '开始简单测试'}
            </button>

            <button
              onClick={handleCheckStatus}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiCheck />
              检查API状态
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiCheck className="text-green-600 mt-1 mr-3" />
                <div className="text-green-800">
                  <h3 className="font-medium mb-2">测试成功</h3>
                  <p className="text-sm mb-3">{result.message}</p>
                  {result.data?.instructions && (
                    <ul className="text-sm space-y-1">
                      {result.data.instructions.map((instruction: string, index: number) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 详细结果 */}
          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">详细结果</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* 调试信息 */}
          <div className="mt-6 text-sm text-gray-500">
            <p>💡 提示：打开浏览器开发者工具的 Console 标签页可以看到详细的调试信息</p>
          </div>
        </div>
      </div>
    </div>
  );
}
