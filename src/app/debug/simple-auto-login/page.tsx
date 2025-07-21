'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiInfo, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function SimpleAutoLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({
    siteName: '百度账号',
    url: 'https://passport.baidu.com/v2/?login',
    username: 'your_username',
    password: 'your_password'
  });

  const handleAutoLogin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🚀 开始简化自动登录...');

      const response = await fetch('/api/simple-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log('📊 自动登录结果:', data);

      setResult(data);

      if (!data.success) {
        setError(data.error || '自动登录失败');
      }
    } catch (err) {
      console.error('❌ 自动登录请求失败:', err);
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
            <h1 className="text-2xl font-bold text-gray-900">简化自动登录测试</h1>
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
                <h3 className="font-medium mb-2">功能特点</h3>
                <ul className="text-sm space-y-1">
                  <li>• 🚀 自动打开浏览器并导航到登录页面</li>
                  <li>• 🔐 自动识别并填写用户名和密码</li>
                  <li>• 🎯 自动点击登录按钮</li>
                  <li>• 🔍 自动检测验证码提示</li>
                  <li>• ✅ 自动验证登录状态</li>
                  <li>• 💾 保存会话数据到独立目录</li>
                  <li>• 🔗 浏览器独立运行（关闭服务器后仍运行）</li>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 快速设置 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">快速设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setLoginData({
                  siteName: '百度账号',
                  url: 'https://passport.baidu.com/v2/?login',
                  username: 'your_username',
                  password: 'your_password'
                })}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">百度登录</div>
                <div className="text-sm text-gray-500">passport.baidu.com</div>
              </button>
              
              <button
                onClick={() => setLoginData({
                  siteName: '微博登录',
                  url: 'https://weibo.com/login.php',
                  username: 'your_username',
                  password: 'your_password'
                })}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">微博登录</div>
                <div className="text-sm text-gray-500">weibo.com</div>
              </button>

              <button
                onClick={() => setLoginData({
                  siteName: 'GitHub',
                  url: 'https://github.com/login',
                  username: 'your_username',
                  password: 'your_password'
                })}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">GitHub</div>
                <div className="text-sm text-gray-500">github.com</div>
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleAutoLogin}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiCheck />
              )}
              {loading ? '自动登录中...' : '开始自动登录'}
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
                  <h3 className="font-medium mb-2">执行成功</h3>
                  <p className="text-sm mb-3">{result.message}</p>
                  
                  {result.data?.loginSteps && (
                    <div className="mb-3">
                      <h4 className="font-medium mb-2">登录步骤：</h4>
                      <ul className="text-sm space-y-1">
                        {result.data.loginSteps.map((step: string, index: number) => (
                          <li key={index} className="font-mono">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

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
          )}

          {/* 使用说明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">使用说明</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. 填写真实的登录信息（用户名和密码）</li>
              <li>2. 点击"开始自动登录"</li>
              <li>3. 观察浏览器窗口的自动登录过程</li>
              <li>4. 如有验证码，请在浏览器中手动输入</li>
              <li>5. 登录完成后，尝试关闭这个页面和服务器</li>
              <li>6. 检查浏览器是否仍在运行（这就是持久化效果）</li>
              <li>7. 会话数据保存在项目目录的 .browser-sessions 文件夹中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
