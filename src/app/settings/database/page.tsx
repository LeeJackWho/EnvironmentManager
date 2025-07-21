'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiSave, FiRefreshCw, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * 数据库配置页面
 * 用于配置 Notion API Key 和数据库 ID
 */
export default function DatabaseConfigPage() {
  const [config, setConfig] = useState({
    apiKey: '',
    databaseId: ''
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // 加载当前配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/settings/database');
      const data = await response.json();
      if (data.success) {
        setConfig({
          apiKey: data.config.apiKey || '',
          databaseId: data.config.databaseId || ''
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setSaved(false);
    
    try {
      const response = await fetch('/api/settings/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('保存失败: ' + data.error);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败，请重试');
    }
    
    setLoading(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/debug/test-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestResult({
        success: false,
        error: '测试连接失败',
        details: { message: (error as Error).message }
      });
    }
    
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiDatabase />
          数据库配置
        </h1>
        <p className="text-gray-600 mt-1">
          配置 Notion API 密钥和数据库 ID
        </p>
      </div>

      {/* 配置表单 */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">基础配置</h2>
        
        {/* API Key 配置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notion API Key *
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? (
                <FiEyeOff className="h-4 w-4" />
              ) : (
                <FiEye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            从 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Notion Integrations</a> 获取，以 "ntn_" 开头
          </p>
        </div>

        {/* Database ID 配置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            数据库 ID *
          </label>
          <input
            type="text"
            value={config.databaseId}
            onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            从 Notion 数据库页面 URL 中提取的 32 位字符串
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={saveConfig}
            disabled={loading || !config.apiKey || !config.databaseId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : saved ? (
              <FiCheck />
            ) : (
              <FiSave />
            )}
            {loading ? '保存中...' : saved ? '已保存' : '保存配置'}
          </button>

          <button
            onClick={testConnection}
            disabled={testing || !config.apiKey || !config.databaseId}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={testing ? 'animate-spin' : ''} />
            {testing ? '测试中...' : '测试连接'}
          </button>
        </div>
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">连接测试结果</h3>
          
          {testResult.success ? (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <FiCheck className="text-green-500" />
                <h4 className="font-medium text-green-900">连接成功</h4>
              </div>
              <p className="text-sm text-green-800">{testResult.message}</p>
              {testResult.database && (
                <div className="mt-3 text-sm text-green-700">
                  <p><strong>数据库标题:</strong> {testResult.database.title}</p>
                  <p><strong>字段数量:</strong> {testResult.database.fieldCount}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <FiX className="text-red-500" />
                <h4 className="font-medium text-red-900">连接失败</h4>
              </div>
              <p className="text-sm text-red-800">{testResult.error}</p>
              {testResult.details && (
                <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* 配置指南 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">📖 配置指南</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>1. 创建 Notion Integration:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>访问 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline">Notion Integrations</a></li>
            <li>点击 "New integration" 创建新集成</li>
            <li>复制生成的 API Key（以 "ntn_" 开头）</li>
          </ul>
          
          <p className="mt-4"><strong>2. 获取数据库 ID:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>打开你的 Notion 数据库页面</li>
            <li>从 URL 中复制数据库 ID（32位字符串）</li>
            <li>URL 格式: https://www.notion.so/workspace/<strong>数据库ID</strong>?v=视图ID</li>
          </ul>
          
          <p className="mt-4"><strong>3. 连接数据库:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>在数据库页面点击 "Share" → "Add connections"</li>
            <li>添加你创建的 Integration</li>
            <li>确保权限设置为 "Can edit"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
