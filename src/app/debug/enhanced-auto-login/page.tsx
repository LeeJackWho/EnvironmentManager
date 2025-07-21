'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiInfo, FiArrowLeft, FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';

export default function EnhancedAutoLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [siteData, setSiteData] = useState({
    name: '测试网站',
    url: 'https://passport.baidu.com/v2/?login',
    username: 'your_username',
    password: 'your_password',
    captchaType: '图形',
    notes: '测试百度登录页面的自动登录功能'
  });

  const handleEnhancedAutoLogin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🚀 开始增强自动登录测试...');

      const response = await fetch('/api/enhanced-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      });

      const data = await response.json();
      console.log('📊 增强自动登录结果:', data);

      setResult(data);

      if (!data.success) {
        setError(data.error || '增强自动登录失败');
      }
    } catch (err) {
      console.error('❌ 增强自动登录请求失败:', err);
      setError('请求失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const presetSites = [
    {
      name: '百度账号',
      url: 'https://passport.baidu.com/v2/?login',
      captchaType: '图形',
      notes: '百度登录页面，支持图形验证码'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/login',
      captchaType: '无',
      notes: 'GitHub登录页面，通常无验证码'
    },
    {
      name: '微博',
      url: 'https://weibo.com/login.php',
      captchaType: '滑动',
      notes: '微博登录页面，可能有滑动验证码'
    }
  ];

  const handlePresetSelect = (preset: any) => {
    setSiteData({
      ...siteData,
      name: preset.name,
      url: preset.url,
      captchaType: preset.captchaType,
      notes: preset.notes
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiSettings className="mr-3 text-purple-600" />
              增强自动登录测试
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiInfo className="text-purple-600 mt-1 mr-3" />
              <div className="text-purple-800">
                <h3 className="font-medium mb-2">增强功能特点</h3>
                <ul className="text-sm space-y-1">
                  <li>• 🎯 根据验证码类型采用不同处理策略</li>
                  <li>• 🔍 智能元素识别和自适应选择器</li>
                  <li>• 📊 详细的执行步骤和调试信息</li>
                  <li>• 🛡️ 增强的错误处理和重试机制</li>
                  <li>• 🎨 支持自定义网站配置</li>
                  <li>• 💾 会话持久化和状态保存</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 预设网站 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">快速选择预设网站</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presetSites.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{preset.notes}</p>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    验证码: {preset.captchaType}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 网站配置 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">网站配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站名称
                </label>
                <input
                  type="text"
                  value={siteData.name}
                  onChange={(e) => setSiteData({ ...siteData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  登录页面URL
                </label>
                <input
                  type="url"
                  value={siteData.url}
                  onChange={(e) => setSiteData({ ...siteData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={siteData.username}
                  onChange={(e) => setSiteData({ ...siteData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="请输入真实的用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={siteData.password}
                    onChange={(e) => setSiteData({ ...siteData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="请输入真实的密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FiEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码类型
                </label>
                <select
                  value={siteData.captchaType}
                  onChange={(e) => setSiteData({ ...siteData, captchaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="无">无验证码</option>
                  <option value="图形">图形验证码</option>
                  <option value="滑动">滑动验证码</option>
                  <option value="点击">点击验证码</option>
                  <option value="短信">短信验证码</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <input
                  type="text"
                  value={siteData.notes}
                  onChange={(e) => setSiteData({ ...siteData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="可选的备注信息"
                />
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleEnhancedAutoLogin}
              disabled={loading || !siteData.url || !siteData.username || !siteData.password}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiSettings />
              )}
              {loading ? '增强登录中...' : '开始增强自动登录'}
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
                    <h3 className="font-medium mb-2">增强自动登录成功</h3>
                    <p className="text-sm mb-3">{result.message}</p>
                    
                    {result.data?.steps && (
                      <div>
                        <h4 className="font-medium mb-2">执行步骤：</h4>
                        <ul className="text-sm space-y-1">
                          {result.data.steps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 详细结果展示 */}
              {result.data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 登录信息 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3">登录信息</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>网站:</strong> {result.data.siteName}</p>
                      <p><strong>URL:</strong> {result.data.url}</p>
                      <p><strong>验证码类型:</strong> {result.data.captchaType}</p>
                      <p><strong>时间:</strong> {result.data.timestamp}</p>
                    </div>
                  </div>

                  {/* 执行结果 */}
                  {result.data.loginResult && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-medium text-purple-900 mb-3">执行结果</h3>
                      <div className="text-sm text-purple-800 space-y-1">
                        <p><strong>用户名填写:</strong> {result.data.loginResult.usernameFilled ? '成功' : '失败'}</p>
                        <p><strong>密码填写:</strong> {result.data.loginResult.passwordFilled ? '成功' : '失败'}</p>
                        <p><strong>登录按钮:</strong> {result.data.loginResult.loginButtonClicked ? '已点击' : '未点击'}</p>
                        <p><strong>验证码检测:</strong> {result.data.loginResult.captchaDetected ? '检测到' : '未检测到'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">使用说明</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. 选择预设网站或手动配置网站信息</li>
              <li>2. 填写真实的用户名和密码</li>
              <li>3. 选择正确的验证码类型</li>
              <li>4. 点击"开始增强自动登录"</li>
              <li>5. 观察浏览器窗口的自动操作过程</li>
              <li>6. 根据验证码类型，系统会采用不同的处理策略</li>
              <li>7. 查看详细的执行结果和调试信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
