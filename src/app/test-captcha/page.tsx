'use client';

import { useState } from 'react';

export default function TestCaptchaPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [siteId, setSiteId] = useState('');

  const testEnhancedCaptcha = async () => {
    if (!siteId.trim()) {
      alert('请输入网站ID');
      return;
    }

    setLoading(true);
    try {
      // 首先获取网站信息
      const siteResponse = await fetch(`/api/sites/${siteId.trim()}`);
      if (!siteResponse.ok) {
        const errorText = await siteResponse.text();
        throw new Error(`获取网站信息失败: ${siteResponse.status} ${siteResponse.statusText} - ${errorText}`);
      }
      const siteData = await siteResponse.json();

      if (!siteData.success) {
        throw new Error(siteData.error || '获取网站信息失败');
      }

      console.log('获取到的网站信息:', siteData.data);

      const site = siteData.data;

      // 使用网站信息调用增强登录API
      const response = await fetch('/api/enhanced-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: site.name,
          url: site.url,
          username: site.username,
          password: site.password,
          captchaType: site.captchaType || '图形验证码',
          notes: site.notes || '',
          useMidscene: true
        }),
      });
      const data = await response.json();
      setResult({ type: 'enhanced-captcha', data });
    } catch (error) {
      setResult({ type: 'enhanced-captcha', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleCaptcha = async () => {
    if (!siteId.trim()) {
      alert('请输入网站ID');
      return;
    }

    setLoading(true);
    try {
      // 首先获取网站信息
      const siteResponse = await fetch(`/api/sites/${siteId.trim()}`);
      if (!siteResponse.ok) {
        throw new Error('获取网站信息失败');
      }
      const siteData = await siteResponse.json();

      if (!siteData.success) {
        throw new Error(siteData.error || '获取网站信息失败');
      }

      const site = siteData.data;

      // 使用网站信息调用简单登录API
      const response = await fetch('/api/simple-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: site.name,
          url: site.url,
          username: site.username,
          password: site.password,
          captchaType: site.captchaType || '图形验证码',
          notes: site.notes || ''
        }),
      });
      const data = await response.json();
      setResult({ type: 'simple-captcha', data });
    } catch (error) {
      setResult({ type: 'simple-captcha', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDebugCaptcha = async () => {
    if (!siteId.trim()) {
      alert('请输入网站ID');
      return;
    }

    setLoading(true);
    try {
      // 首先获取网站信息
      const siteResponse = await fetch(`/api/sites/${siteId.trim()}`);
      if (!siteResponse.ok) {
        throw new Error('获取网站信息失败');
      }
      const siteData = await siteResponse.json();

      if (!siteData.success) {
        throw new Error(siteData.error || '获取网站信息失败');
      }

      const site = siteData.data;

      // 使用网站信息调用调试登录API
      const response = await fetch('/api/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: site.name,
          url: site.url,
          username: site.username,
          password: site.password,
          captchaType: site.captchaType || '图形验证码',
          notes: site.notes || '',
          useMidscene: true
        }),
      });
      const data = await response.json();
      setResult({ type: 'debug-captcha', data });
    } catch (error) {
      setResult({ type: 'debug-captcha', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">验证码测试页面</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">测试配置</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              网站ID (必填)
            </label>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="请输入要测试的网站ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              提示：请先在系统中添加一个测试网站，然后使用其ID进行测试
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testEnhancedCaptcha}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            🤖 测试增强验证码识别
          </button>
          
          <button
            onClick={testSimpleCaptcha}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            📝 测试简单验证码处理
          </button>
          
          <button
            onClick={testDebugCaptcha}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            🔍 测试调试模式验证码
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">测试说明</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>增强验证码识别</strong>：使用 Midscene.js AI 技术识别多种验证码类型</li>
            <li>• <strong>简单验证码处理</strong>：使用传统 OCR 技术处理文字验证码</li>
            <li>• <strong>调试模式验证码</strong>：详细的调试信息和步骤记录</li>
            <li>• 支持的验证码类型：文字、点击、网格、滑块、旋转、逻辑、拖拽、序列</li>
          </ul>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">正在测试验证码识别...</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              测试结果 - {result.type}
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
