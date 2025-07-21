'use client';

import { useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

interface TestSite {
  name: string;
  url: string;
  username: string;
  password: string;
  captchaType: '无' | '图形' | '滑动';
}

interface LoginResult {
  success: boolean;
  message: string;
  screenshots?: string[];
  cookiesCount?: number;
  error?: string;
}

export default function AutoLoginDebugPage() {
  const [testSite, setTestSite] = useState<TestSite>({
    name: '测试网站',
    url: 'https://example.com/login',
    username: '',
    password: '',
    captchaType: '无',
  });

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAutoLogin = async () => {
    setTesting(true);
    setResult(null);
    setLogs([]);
    
    addLog('🚀 开始自动登录测试...');
    addLog(`📍 目标网站: ${testSite.name}`);
    addLog(`🌐 URL: ${testSite.url}`);
    addLog(`👤 用户名: ${testSite.username}`);
    addLog(`🔐 验证码类型: ${testSite.captchaType}`);

    try {
      // 创建一个临时的网站记录用于测试
      addLog('📝 创建临时测试记录...');
      
      const createResponse = await fetch('/api/sites/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testSite,
          category: '测试环境',
          notes: '自动登录调试测试',
        }),
      });

      const createData = await createResponse.json();
      
      if (!createData.success) {
        throw new Error(`创建测试记录失败: ${createData.error}`);
      }

      const siteId = createData.data.id;
      addLog(`✅ 测试记录创建成功: ${siteId}`);

      // 执行自动登录
      addLog('🎯 开始执行自动登录...');
      
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId }),
      });

      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        addLog('✅ 自动登录成功!');
        addLog(`📊 Cookie数量: ${loginData.data.cookiesCount || 0}`);
        addLog(`📸 截图数量: ${loginData.data.screenshots?.length || 0}`);
        
        setResult({
          success: true,
          message: loginData.message,
          screenshots: loginData.data.screenshots || [],
          cookiesCount: loginData.data.cookiesCount || 0,
        });
      } else {
        addLog('❌ 自动登录失败');
        addLog(`错误信息: ${loginData.error || loginData.message}`);
        
        setResult({
          success: false,
          message: loginData.message,
          error: loginData.error,
        });
      }

      // 清理测试记录
      addLog('🧹 清理测试记录...');
      try {
        await fetch(`/api/sites/${siteId}`, {
          method: 'DELETE',
        });
        addLog('✅ 测试记录已清理');
      } catch (cleanupError) {
        addLog('⚠️ 清理测试记录失败，请手动删除');
      }

    } catch (error) {
      addLog(`💥 测试过程中发生错误: ${error}`);
      setResult({
        success: false,
        message: '测试过程中发生错误',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setTesting(false);
      addLog('🏁 自动登录测试完成');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🧪 自动登录功能调试</h1>
              <p className="text-gray-600">
                测试智能自动登录功能，包括元素识别、验证码处理和会话保持
              </p>
            </div>
            <Link
              href="/debug"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiArrowLeft size={16} />
              返回调试工具
            </Link>
          </div>
        </div>

        {/* 测试配置 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">测试配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站名称
              </label>
              <input
                type="text"
                value={testSite.name}
                onChange={(e) => setTestSite({ ...testSite, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入网站名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                登录页面URL
              </label>
              <input
                type="url"
                value={testSite.url}
                onChange={(e) => setTestSite({ ...testSite, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/login"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={testSite.username}
                onChange={(e) => setTestSite({ ...testSite, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={testSite.password}
                  onChange={(e) => setTestSite({ ...testSite, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码类型
              </label>
              <select
                value={testSite.captchaType}
                onChange={(e) => setTestSite({ ...testSite, captchaType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="无">无验证码</option>
                <option value="图形">图形验证码</option>
                <option value="滑动">滑动验证码</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={testAutoLogin}
              disabled={testing || !testSite.url || !testSite.username || !testSite.password}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiCheck />
              )}
              {testing ? '测试中...' : '开始测试'}
            </button>
          </div>
        </div>

        {/* 测试日志 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">测试日志</h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">等待测试开始...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 测试结果 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">测试结果</h2>
            
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <FiCheck className="text-green-600" />
                ) : (
                  <FiX className="text-red-600" />
                )}
                <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '测试成功' : '测试失败'}
                </span>
              </div>
              
              <p className={`${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
              
              {result.error && (
                <p className="text-red-600 mt-2 text-sm">
                  错误详情: {result.error}
                </p>
              )}
              
              {result.success && (
                <div className="mt-3 text-sm text-green-700">
                  <p>Cookie数量: {result.cookiesCount}</p>
                  <p>截图数量: {result.screenshots?.length || 0}</p>
                </div>
              )}
            </div>

            {/* 显示截图 */}
            {result.screenshots && result.screenshots.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">登录过程截图</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.screenshots.map((screenshot, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={screenshot}
                        alt={`截图 ${index + 1}`}
                        className="w-full h-auto"
                      />
                      <div className="p-2 bg-gray-50 text-sm text-gray-600">
                        截图 {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 输入真实的登录页面URL和有效的账号密码</li>
            <li>• 系统会自动识别登录元素并尝试登录</li>
            <li>• 如果有验证码，系统会尝试自动识别或等待人工处理</li>
            <li>• 测试完成后会自动清理临时记录</li>
            <li>• 查看日志了解详细的执行过程</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
