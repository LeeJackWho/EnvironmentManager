'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setResult({ type: 'health', data });
    } catch (error) {
      setResult({ type: 'health', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/database/options');
      const data = await response.json();
      setResult({ type: 'options', data });
    } catch (error) {
      setResult({ type: 'options', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAddSite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sites/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '测试网站',
          url: 'https://test.example.com',
          username: 'testuser',
          password: 'testpass',
          environment: '测试环境',
          captchaType: '无',
          notes: '这是一个测试网站'
        }),
      });
      const data = await response.json();
      setResult({ type: 'add', data });
    } catch (error) {
      setResult({ type: 'add', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API 测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            测试健康检查
          </button>
          
          <button
            onClick={testDatabaseOptions}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            测试数据库选项
          </button>
          
          <button
            onClick={testAddSite}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            测试添加网站
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">测试中...</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              测试结果 - {result.type}
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
