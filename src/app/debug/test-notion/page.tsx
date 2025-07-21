'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

/**
 * Notion API 连接测试页面
 * 用于测试 Notion API 密钥和数据库连接状态
 */
export default function TestNotionPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const runConfigTest = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    try {
      // 测试健康检查
      console.log('🔍 测试健康检查API...');
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      results.health = {
        success: healthResponse.ok,
        data: healthData,
        status: healthResponse.status
      };

      // 测试添加网站（用于检查Notion配置）
      console.log('🔍 测试Notion连接...');
      const testSite = {
        name: '配置测试网站',
        url: 'https://config-test.example.com',
        username: 'test_user',
        password: 'test_pass',
        environment: '测试环境',
        captchaType: '无',
        notes: '这是配置测试数据，可以删除'
      };

      const addResponse = await fetch('/api/sites/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSite)
      });
      const addData = await addResponse.json();
      results.notionTest = {
        success: addResponse.ok,
        data: addData,
        status: addResponse.status
      };

      // 如果添加成功，测试获取数据
      if (addResponse.ok) {
        console.log('🔍 测试获取数据...');
        const sitesResponse = await fetch('/api/sites');
        const sitesData = await sitesResponse.json();
        results.getData = {
          success: sitesResponse.ok,
          data: sitesData,
          status: sitesResponse.status
        };

        const envResponse = await fetch('/api/environments');
        const envData = await envResponse.json();
        results.getEnvironments = {
          success: envResponse.ok,
          data: envData,
          status: envResponse.status
        };
      }

    } catch (error) {
      console.error('测试过程中出错:', error);
      results.error = error;
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <FiCheck className="text-green-500" />
    ) : (
      <FiX className="text-red-500" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notion 连接测试</h1>
          <p className="text-gray-600 mt-1">测试 Notion API 配置和数据库连接</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/debug"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiArrowLeft size={16} />
            返回调试工具
          </Link>
          <button
            onClick={runConfigTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? '测试中...' : '开始测试'}
          </button>
        </div>
      </div>

      {/* 配置说明 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-medium text-yellow-900 mb-3">📋 配置检查清单</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p><strong>1. 检查 .env.local 文件：</strong></p>
          <div className="bg-yellow-100 p-3 rounded font-mono text-xs">
            NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx<br/>
            NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
          </div>
          
          <p><strong>2. Notion 数据库字段要求：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Name</strong> (Title) - 标题类型</li>
            <li><strong>URL</strong> (URL) - URL类型</li>
            <li><strong>Username</strong> (Text) - 文本类型</li>
            <li><strong>Password</strong> (Text) - 文本类型</li>
            <li><strong>Category</strong> (Select) - 选择类型，选项：开发、测试、生产</li>
            <li><strong>CaptchaType</strong> (Select) - 选择类型，选项：无、图片、滑动</li>
            <li><strong>Status</strong> (Status) - 状态类型，选项：启用、禁用</li>
            <li><strong>Cookies</strong> (Text) - 文本类型</li>
            <li><strong>Description</strong> (Text) - 文本类型</li>
          </ul>
          
          <p><strong>3. 权限设置：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>确保集成已添加到数据库的连接中</li>
            <li>集成需要有读取和写入权限</li>
          </ul>
        </div>
      </div>

      {/* 测试结果 */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">测试结果</h2>
          <div className="space-y-4">
            {testResults.health && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.health.success)}
                  <h3 className="font-medium">健康检查</h3>
                  <span className="text-sm text-gray-500">({testResults.health.status})</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(testResults.health.data, null, 2)}
                </pre>
              </div>
            )}

            {testResults.notionTest && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.notionTest.success)}
                  <h3 className="font-medium">Notion 连接测试</h3>
                  <span className="text-sm text-gray-500">({testResults.notionTest.status})</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(testResults.notionTest.data, null, 2)}
                </pre>
              </div>
            )}

            {testResults.getData && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.getData.success)}
                  <h3 className="font-medium">获取网站数据</h3>
                  <span className="text-sm text-gray-500">({testResults.getData.status})</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(testResults.getData.data, null, 2)}
                </pre>
              </div>
            )}

            {testResults.getEnvironments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.getEnvironments.success)}
                  <h3 className="font-medium">获取环境数据</h3>
                  <span className="text-sm text-gray-500">({testResults.getEnvironments.status})</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(testResults.getEnvironments.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 故障排除 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="font-medium text-red-900 mb-3">🔧 常见问题解决</h3>
        <div className="text-sm text-red-800 space-y-2">
          <p><strong>如果出现 "数据库不存在或无权限访问" 错误：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>检查 NOTION_DATABASE_ID 是否正确</li>
            <li>确保集成已添加到数据库连接中</li>
            <li>检查集成是否有足够的权限</li>
          </ul>
          
          <p><strong>如果出现 "API 密钥无效" 错误：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>检查 NOTION_API_KEY 是否正确</li>
            <li>确保 API 密钥以 "ntn_" 开头</li>
            <li>重新生成集成密钥</li>
          </ul>
          
          <p><strong>如果出现字段配置错误：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>检查数据库字段名称是否完全匹配</li>
            <li>确保字段类型正确</li>
            <li>检查选择字段的选项是否存在</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
