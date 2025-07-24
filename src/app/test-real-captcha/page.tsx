'use client';

import { useState } from 'react';

export default function TestRealCaptchaPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const testRealWebsiteCaptcha = async () => {
    if (!testUrl.trim()) {
      alert('请输入要测试的网站URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/enhanced-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '验证码测试',
          url: testUrl.trim(),
          username: username.trim() || 'test',
          password: password.trim() || 'test',
          captchaType: '图形验证码',
          notes: '实时验证码测试',
          useMidscene: true
        }),
      });
      const data = await response.json();
      setResult({ type: 'real-website', data });
    } catch (error) {
      setResult({ type: 'real-website', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testCaptchaOnly = async () => {
    if (!testUrl.trim()) {
      alert('请输入要测试的网站URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/captcha-only-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl.trim(),
          captchaType: '图形验证码'
        }),
      });
      const data = await response.json();
      setResult({ type: 'captcha-only', data });
    } catch (error) {
      setResult({ type: 'captcha-only', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">真实网站验证码测试</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">测试配置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站URL (必填) *
              </label>
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com/login"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                输入要测试验证码的网站登录页面URL
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名 (可选)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="测试用户名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码 (可选)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="测试密码"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={testRealWebsiteCaptcha}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            🤖 完整登录测试 (含验证码)
          </button>
          
          <button
            onClick={testCaptchaOnly}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            🔍 仅测试验证码识别
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">测试说明</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• <strong>完整登录测试</strong>：访问网站，填写用户名密码，识别并处理验证码，尝试完整登录流程</li>
            <li>• <strong>仅测试验证码识别</strong>：只访问网站并识别验证码，不进行登录操作</li>
            <li>• 支持多种验证码类型：文字、数字、点击、滑块、旋转、网格选择等</li>
            <li>• 系统会自动截图并使用AI分析验证码内容</li>
            <li>• 测试过程中会生成详细的调试日志</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">常见测试网站示例</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• <strong>文字验证码</strong>：大多数政府网站、企业内网</p>
            <p>• <strong>滑块验证码</strong>：淘宝、京东等电商网站</p>
            <p>• <strong>点击验证码</strong>：Google reCAPTCHA、腾讯验证码</p>
            <p>• <strong>网格验证码</strong>：选择图片中的特定物体</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">正在测试验证码识别...</p>
            <p className="text-sm text-gray-500">这可能需要10-30秒，请耐心等待</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              测试结果 - {result.type}
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
              <pre className="text-sm max-h-96 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            
            {result.data && result.data.screenshots && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">截图记录</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.data.screenshots).map(([key, path]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-1">{key}</p>
                      <p className="text-xs text-gray-500 break-all">{path}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
