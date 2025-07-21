'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiInfo, FiTool, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function LoginDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({
    siteName: '百度账号',
    url: 'https://passport.baidu.com/v2/?login',
    username: 'your_username',
    password: 'your_password'
  });

  const handleDebugLogin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🐛 开始调试登录...');

      const response = await fetch('/api/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log('📊 调试结果:', data);

      setResult(data);

      if (!data.success) {
        setError(data.error || '调试失败');
      }
    } catch (err) {
      console.error('❌ 调试请求失败:', err);
      setError('请求失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiTool className="mr-3 text-orange-600" />
              登录调试工具
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiInfo className="text-orange-600 mt-1 mr-3" />
              <div className="text-orange-800">
                <h3 className="font-medium mb-2">调试功能</h3>
                <ul className="text-sm space-y-1">
                  <li>• 🐛 详细的调试日志输出</li>
                  <li>• 📊 完整的页面表单分析</li>
                  <li>• 📸 关键步骤截图保存</li>
                  <li>• 🔍 逐步的元素查找过程</li>
                  <li>• 💾 所有调试信息保存到文件</li>
                  <li>• 🔗 浏览器保持打开便于手动操作</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 登录配置 */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">登录配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站名称
                </label>
                <input
                  type="text"
                  value={loginData.siteName}
                  onChange={(e) => setLoginData({ ...loginData, siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  登录页面URL
                </label>
                <input
                  type="url"
                  value={loginData.url}
                  onChange={(e) => setLoginData({ ...loginData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleDebugLogin}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiTool />
              )}
              {loading ? '调试中...' : '开始调试登录'}
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
                    <h3 className="font-medium mb-2">调试完成</h3>
                    <p className="text-sm mb-3">{result.message}</p>
                    
                    {result.data?.instructions && (
                      <div>
                        <h4 className="font-medium mb-2">说明：</h4>
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

              {/* 页面信息 */}
              {result.data?.pageInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">页面信息</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>URL:</strong> {result.data.pageInfo.url}</p>
                    <p><strong>标题:</strong> {result.data.pageInfo.title}</p>
                    <p><strong>时间:</strong> {result.data.pageInfo.timestamp}</p>
                  </div>
                </div>
              )}

              {/* 表单分析 */}
              {result.data?.formAnalysis && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3">表单分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">输入框 ({result.data.formAnalysis.inputs?.length || 0})</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {result.data.formAnalysis.inputs?.map((input: any, index: number) => (
                          <div key={index} className="text-purple-700 mb-1">
                            <span className="font-mono text-xs">
                              {input.type} - {input.name || input.id || input.placeholder || '无标识'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">按钮 ({result.data.formAnalysis.buttons?.length || 0})</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {result.data.formAnalysis.buttons?.map((button: any, index: number) => (
                          <div key={index} className="text-purple-700 mb-1">
                            <span className="font-mono text-xs">
                              {button.type} - {button.textContent || button.name || button.id || '无文本'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">表单 ({result.data.formAnalysis.forms?.length || 0})</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {result.data.formAnalysis.forms?.map((form: any, index: number) => (
                          <div key={index} className="text-purple-700 mb-1">
                            <span className="font-mono text-xs">
                              {form.method} - {form.action || form.id || '无标识'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 登录步骤 */}
              {result.data?.loginSteps && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">登录步骤</h3>
                  <ul className="text-sm space-y-1">
                    {result.data.loginSteps.map((step: string, index: number) => (
                      <li key={index} className="font-mono text-gray-700">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">使用说明</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. 填写真实的登录信息</li>
              <li>2. 点击"开始调试登录"</li>
              <li>3. 观察浏览器窗口和控制台输出</li>
              <li>4. 查看表单分析结果，了解页面结构</li>
              <li>5. 检查登录步骤，看哪一步失败了</li>
              <li>6. 截图文件保存在 .browser-sessions/debug_[时间戳]/ 目录中</li>
              <li>7. 浏览器保持打开，您可以手动完成登录</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
