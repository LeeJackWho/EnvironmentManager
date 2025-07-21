'use client';

import { useState, useEffect } from 'react';
import { FiSettings, FiRefreshCw, FiCheck, FiX, FiClock, FiExternalLink, FiPlus, FiEdit, FiPauseCircle, FiPlay, FiEye, FiEyeOff, FiActivity, FiMonitor, FiCheckCircle, FiChevronDown, FiZap, FiTool } from 'react-icons/fi';
import type { DatabaseOptions } from '@/types';
import TaskMonitor from '@/components/TaskMonitor';

interface Site {
  id: string;
  name: string;
  url: string;
  username: string;
  status: string;
  environment: string;
  notes: string;
  captchaType?: string;
}

interface Environment {
  name: string;
  color: string;
  count: number;
  sites: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

interface SiteFormData {
  name: string;
  url: string;
  username: string;
  password: string;
  environment: string;
  captchaType: string;
  notes: string;
}

export default function EnvironmentsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    url: '',
    username: '',
    password: '',
    environment: '测试环境',
    captchaType: '无',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loginLoading, setLoginLoading] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<string>('');
  const [statusCheckLoading, setStatusCheckLoading] = useState<string>('');

  const [databaseOptions, setDatabaseOptions] = useState<DatabaseOptions>({
    Category: [],
    CaptchaType: [],
    Status: []
  });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showLoginModeDropdown, setShowLoginModeDropdown] = useState<Record<string, boolean>>({});

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.login-mode-dropdown')) {
        setShowLoginModeDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Notion颜色到Tailwind CSS类的映射
  const getColorClasses = (notionColor: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; number: string }> = {
      'red': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', number: 'text-red-600' },
      'orange': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', number: 'text-orange-600' },
      'yellow': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', number: 'text-yellow-600' },
      'green': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', number: 'text-green-600' },
      'blue': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', number: 'text-blue-600' },
      'purple': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', number: 'text-purple-600' },
      'pink': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', number: 'text-pink-600' },
      'brown': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', number: 'text-amber-600' },
      'gray': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', number: 'text-gray-600' },
      'default': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', number: 'text-gray-600' }
    };

    return colorMap[notionColor] || colorMap['default'];
  };

  // 获取数据库字段选项
  const fetchDatabaseOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await fetch('/api/database/options');
      const data = await response.json();

      if (data.success) {
        setDatabaseOptions(data.data.options);

        // 设置表单默认值为第一个选项
        if (data.data.options.Category.length > 0 && !formData.environment) {
          setFormData(prev => ({
            ...prev,
            environment: data.data.options.Category[0].name
          }));
        }
        if (data.data.options.CaptchaType.length > 0 && !formData.captchaType) {
          setFormData(prev => ({
            ...prev,
            captchaType: data.data.options.CaptchaType[0].name
          }));
        }
      } else {
        console.error('获取数据库选项失败:', data.error);
      }
    } catch (error) {
      console.error('获取数据库选项失败:', error);
    } finally {
      setOptionsLoading(false);
    }
  };

  // 获取环境列表
  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/environments');
      const data = await response.json();
      if (data.success) {
        setEnvironments(data.environments);
      }
    } catch (err) {
      console.error('获取环境列表失败:', err);
    }
  };

  // 获取网站列表
  const fetchSites = async (environment?: string, skipIfTesting = false) => {
    // 如果有测试正在进行且设置了跳过标志，则不刷新
    if (skipIfTesting && (loginLoading || deleteLoading || statusCheckLoading)) {
      console.log('⚠️ 有测试正在进行，跳过数据刷新');
      return;
    }

    try {
      setLoading(true);
      const url = environment ? `/api/sites?environment=${encodeURIComponent(environment)}` : '/api/sites';
      console.log(`🔍 获取网站列表: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      console.log('📋 网站列表API响应:', data);

      if (data.success) {
        // 兼容新旧API响应格式
        const sitesList = data.data || data.sites || [];
        setSites(sitesList);
        setError('');
        console.log(`✅ 网站列表获取成功: ${sitesList.length}个网站`);
      } else {
        setError(data.error || '获取数据失败');
        setSites([]);
        console.error('❌ 网站列表获取失败:', data.error);
      }
    } catch (err: any) {
      const errorMsg = err.message || '网络请求失败，请检查Notion配置';
      setError(errorMsg);
      setSites([]);
      console.error('❌ 获取网站列表网络错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加网站配置
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/sites/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined);

        // 重置表单
        setFormData({
          name: '',
          url: '',
          username: '',
          password: '',
          environment: databaseOptions.Category[0]?.name || '',
          captchaType: databaseOptions.CaptchaType[0]?.name || '',
          notes: ''
        });
        setShowAddForm(false);
        setError('');
      } else {
        setError(data.error || '添加网站配置失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('添加网站配置失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 开始编辑网站
  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      password: '', // 出于安全考虑，不显示密码
      environment: site.environment,
      captchaType: site.captchaType || databaseOptions.CaptchaType[0]?.name || '',
      notes: site.notes || ''
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // 更新网站配置
  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/sites/${editingSite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined);

        // 重置表单
        setFormData({
          name: '',
          url: '',
          username: '',
          password: '',
          environment: databaseOptions.Category[0]?.name || '',
          captchaType: databaseOptions.CaptchaType[0]?.name || '',
          notes: ''
        });
        setShowEditForm(false);
        setEditingSite(null);
        setError('');
      } else {
        setError(data.error || '更新网站配置失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('更新网站配置失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 禁用网站配置
  const handleDeleteSite = async (siteId: string, siteName: string) => {
    if (!confirm(`确定要禁用网站 "${siteName}" 吗？禁用后将不再显示在列表中。`)) {
      return;
    }

    setDeleteLoading(siteId);

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined);
        setError('');
      } else {
        setError(data.error || '禁用网站配置失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('禁用网站配置失败:', err);
    } finally {
      setDeleteLoading('');
    }
  };

  // 执行自动登录
  const handleAutoLogin = async (siteId: string) => {
    setLoginLoading(siteId);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId }),
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据以更新状态
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined);
      } else {
        setError(data.error || '自动登录失败');
      }
    } catch (err) {
      setError('自动登录请求失败');
      console.error('自动登录失败:', err);
    } finally {
      setLoginLoading('');
    }
  };

  // 检查登录状态
  const handleCheckStatus = async (siteId: string) => {
    setStatusCheckLoading(siteId);

    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId }),
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据以更新状态（跳过如果有其他测试在进行）
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined, true);

        // 显示状态检查结果
        if (data.isLoggedIn) {
          console.log(`✅ ${data.data.siteName}: 登录状态有效`);
        } else {
          console.log(`⚠️ ${data.data.siteName}: 登录已过期`);
        }
      } else {
        setError(data.error || '状态检查失败');
      }
    } catch (err) {
      setError('状态检查请求失败');
      console.error('状态检查失败:', err);
    } finally {
      setStatusCheckLoading('');
    }
  };

  // 维护会话状态
  const handleMaintainSession = async (siteId: string) => {
    setStatusCheckLoading(siteId);

    try {
      const response = await fetch('/api/check-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, action: 'maintain' }),
      });

      const data = await response.json();

      if (data.success) {
        // 重新获取数据以更新状态（跳过如果有其他测试在进行）
        await fetchEnvironments();
        await fetchSites(selectedEnvironment || undefined, true);

        console.log(`🔄 ${data.data.siteName}: 会话维护完成`);
      } else {
        setError(data.error || '会话维护失败');
      }
    } catch (err) {
      setError('会话维护请求失败');
      console.error('会话维护失败:', err);
    } finally {
      setStatusCheckLoading('');
    }
  };

  // 智能自动登录（使用 Midscene.js）- 异步模式
  const handleMidsceneLogin = async (siteId: string) => {
    try {
      // 获取网站数据
      const site = sites.find(s => s.id === siteId);
      if (!site) {
        setError('未找到网站数据');
        return;
      }

      console.log(`🤖 启动 Midscene.js 智能登录: ${site.name}`);

      // 启动异步测试任务
      const response = await fetch(`/api/environments/${siteId}/test-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'midscene'
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`🎉 ${site.name}: Midscene.js 智能登录任务已启动`);
        console.log(`📋 任务ID: ${data.taskId}`);

        // 关闭下拉菜单
        setShowLoginModeDropdown(prev => ({
          ...prev,
          [siteId]: false
        }));

        // 显示成功消息
        setError(''); // 清除之前的错误
        // 可以添加成功提示
      } else {
        setError(data.error || 'Midscene.js 智能登录任务启动失败');
        console.error('❌ Midscene.js 智能登录任务启动失败:', data.error);
      }
    } catch (err) {
      setError('Midscene.js 智能登录请求失败');
      console.error('❌ Midscene.js 智能登录失败:', err);
    }
  };

  // 传统自动登录（OCR/手动）- 异步模式
  const handleTraditionalLogin = async (siteId: string) => {
    try {
      // 获取网站数据
      const site = sites.find(s => s.id === siteId);
      if (!site) {
        setError('未找到网站数据');
        return;
      }

      console.log(`🔧 启动传统自动登录: ${site.name}`);

      // 启动异步测试任务
      const response = await fetch(`/api/environments/${siteId}/test-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'traditional'
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`🎉 ${site.name}: 传统自动登录任务已启动`);
        console.log(`📋 任务ID: ${data.taskId}`);

        // 关闭下拉菜单
        setShowLoginModeDropdown(prev => ({
          ...prev,
          [siteId]: false
        }));

        // 显示成功消息
        setError(''); // 清除之前的错误
        // 可以添加成功提示
      } else {
        setError(data.error || '传统自动登录任务启动失败');
        console.error('❌ 传统自动登录任务启动失败:', data.error);
      }
    } catch (err) {
      setError('传统自动登录请求失败');
      console.error('❌ 传统自动登录失败:', err);
    }
  };

  useEffect(() => {
    fetchDatabaseOptions();
    fetchEnvironments();
    fetchSites();
  }, []);

  const handleEnvironmentChange = (environment: string) => {
    setSelectedEnvironment(environment);
    fetchSites(environment || undefined);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已登录':
        return <FiCheck className="text-green-500" />;
      case '登录失败':
        return <FiX className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已登录':
        return 'bg-green-100 text-green-800 border-green-200';
      case '登录失败':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">环境管理</h1>
          <p className="text-gray-600 mt-1">管理测试环境和生产环境的网站登录状态</p>
          {/* 测试状态指示器 */}
          {(loginLoading || deleteLoading || statusCheckLoading) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              有测试正在进行中，建议避免刷新数据
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiPlus />
            添加网站
          </button>
          <button
            onClick={() => {
              const hasRunningTests = loginLoading || deleteLoading || statusCheckLoading;
              if (hasRunningTests) {
                if (confirm('检测到有测试正在进行，刷新数据可能会影响测试结果。确定要继续吗？')) {
                  fetchSites(selectedEnvironment || undefined);
                }
              } else {
                fetchSites(selectedEnvironment || undefined);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              (loginLoading || deleteLoading || statusCheckLoading)
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            刷新数据
          </button>
        </div>
      </div>

      {/* 环境统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environments.map((env) => {
          const colors = getColorClasses(env.color);
          const isSelected = selectedEnvironment === env.name;

          return (
            <div
              key={env.name}
              className={`rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.border} border-opacity-100`
                  : `bg-white ${colors.border} border-opacity-50 hover:border-opacity-75 hover:${colors.bg}`
              }`}
              onClick={() => handleEnvironmentChange(env.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${isSelected ? colors.text : 'text-gray-900'}`}>
                    {env.name}
                  </h3>
                  <p className={`text-sm ${isSelected ? colors.text + ' opacity-75' : 'text-gray-600'}`}>
                    {env.count} 个网站
                  </p>
                </div>
                <div className={`text-3xl font-bold ${colors.number}`}>{env.count}</div>
              </div>
            <div className="space-y-2">
              {env.sites.slice(0, 3).map((site) => (
                <div key={site.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{site.name}</span>
                  {getStatusIcon(site.status)}
                </div>
              ))}
              {env.sites.length > 3 && (
                <div className="text-xs text-gray-500">
                  还有 {env.sites.length - 3} 个网站...
                </div>
              )}
            </div>
          </div>
          );
        })}
        
        <div
          className={`bg-white rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-all ${
            selectedEnvironment === ''
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleEnvironmentChange('')}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">全部环境</h3>
              <p className="text-sm text-gray-600">
                {environments.reduce((sum, env) => sum + env.count, 0)} 个网站
              </p>
            </div>
            <div className="text-3xl font-bold text-gray-600">
              {environments.reduce((sum, env) => sum + env.count, 0)}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            查看所有环境的网站
          </div>
        </div>
      </div>

      {/* 添加网站表单 */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">添加网站配置</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleAddSite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：测试系统A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站链接 *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="登录用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="登录密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  环境分类 *
                </label>
                <select
                  required
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={optionsLoading}
                >
                  {optionsLoading ? (
                    <option value="">加载选项中...</option>
                  ) : databaseOptions.Category.length > 0 ? (
                    databaseOptions.Category.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无选项</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证码类型
                </label>
                <select
                  value={formData.captchaType}
                  onChange={(e) => setFormData({ ...formData, captchaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={optionsLoading}
                >
                  {optionsLoading ? (
                    <option value="">加载选项中...</option>
                  ) : databaseOptions.CaptchaType.length > 0 ? (
                    databaseOptions.CaptchaType.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无选项</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="可选的备注信息"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '添加中...' : '添加网站'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 编辑网站表单 */}
      {showEditForm && editingSite && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">编辑网站配置</h2>
            <button
              onClick={() => {
                setShowEditForm(false);
                setEditingSite(null);
                setFormData({
                  name: '',
                  url: '',
                  username: '',
                  password: '',
                  environment: databaseOptions.Category[0]?.name || '',
                  captchaType: databaseOptions.CaptchaType[0]?.name || '',
                  notes: ''
                });
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleUpdateSite} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="网站显示名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站链接 *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="登录用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 (留空则不更新)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="留空则不更新密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showEditPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  环境分类 *
                </label>
                <select
                  required
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={optionsLoading}
                >
                  {optionsLoading ? (
                    <option value="">加载选项中...</option>
                  ) : databaseOptions.Category.length > 0 ? (
                    databaseOptions.Category.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无选项</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证码类型
                </label>
                <select
                  value={formData.captchaType}
                  onChange={(e) => setFormData({ ...formData, captchaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={optionsLoading}
                >
                  {optionsLoading ? (
                    <option value="">加载选项中...</option>
                  ) : databaseOptions.CaptchaType.length > 0 ? (
                    databaseOptions.CaptchaType.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无选项</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="可选的备注信息"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingSite(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '更新中...' : '更新网站'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiX className="text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <p className="text-sm text-red-600 mt-2">
            请检查 .env.local 文件中的 NOTION_API_KEY 和 NOTION_DATABASE_ID 配置
          </p>
        </div>
      )}

      {/* 网站列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              网站列表 {selectedEnvironment && `- ${selectedEnvironment}`}
            </h2>
            <span className="text-sm text-gray-600">
              共 {sites.length} 个网站
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="animate-spin text-2xl text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : sites.length === 0 ? (
          <div className="p-8 text-center">
            <FiSettings className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无网站数据</h3>
            <p className="text-gray-600 mb-4">
              请先在 Notion 数据库中添加网站信息，或检查配置是否正确
            </p>
            <a
              href="/NOTION_SETUP.md"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiSettings />
              查看配置指南
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sites.map((site) => (
              <div key={site.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          site.status
                        )}`}
                      >
                        {getStatusIcon(site.status)}
                        {site.status}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {site.environment}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">网站链接:</span>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {site.url}
                          <FiExternalLink size={12} />
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">用户名:</span> {site.username}
                      </p>
                      {site.notes && (
                        <p>
                          <span className="font-medium">备注:</span> {site.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* 启动测试下拉菜单 */}
                    <div className="relative login-mode-dropdown">
                      <button
                        onClick={() => setShowLoginModeDropdown(prev => ({
                          ...prev,
                          [site.id]: !prev[site.id]
                        }))}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="选择启动测试模式"
                      >
                        <FiMonitor size={16} />
                        启动测试
                        <FiChevronDown size={14} className={`transition-transform ${showLoginModeDropdown[site.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 下拉菜单 */}
                      {showLoginModeDropdown[site.id] && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="p-2">
                            <div className="text-xs text-gray-500 mb-2 px-2">选择启动模式</div>

                            {/* Midscene.js 智能模式 */}
                            <button
                              onClick={() => {
                                handleMidsceneLogin(site.id);
                                setShowLoginModeDropdown(prev => ({ ...prev, [site.id]: false }));
                              }}
                              className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FiZap className="text-blue-600 mt-0.5" size={16} />
                              <div>
                                <div className="font-medium text-gray-900">🤖 Midscene.js 智能模式</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  AI 驱动的智能验证码识别和自动解决
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  • 智能识别验证码类型
                                  • 自动解决大部分验证码
                                  • 更高的成功率
                                </div>
                              </div>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            {/* 传统模式 */}
                            <button
                              onClick={() => {
                                handleTraditionalLogin(site.id);
                                setShowLoginModeDropdown(prev => ({ ...prev, [site.id]: false }));
                              }}
                              className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <FiTool className="text-gray-600 mt-0.5" size={16} />
                              <div>
                                <div className="font-medium text-gray-900">🔧 传统模式</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  基于 OCR 识别和传统选择器的自动登录
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  • OCR 文字验证码识别
                                  • 传统元素选择器
                                  • 需要更多手动干预
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditSite(site)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      title="编辑网站配置"
                    >
                      <FiEdit size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteSite(site.id, site.name)}
                      disabled={deleteLoading === site.id}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      title="禁用网站配置"
                    >
                      {deleteLoading === site.id ? (
                        <FiRefreshCw className="animate-spin" size={16} />
                      ) : (
                        <FiPauseCircle size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">💡 使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• 点击环境卡片可以筛选对应环境的网站</li>
          <li>• 确保已正确配置 Notion API Key 和数据库 ID</li>
          <li>• 数据库需要包含"环境分类"字段来区分测试和生产环境</li>
          <li>• 如需帮助，请查看 NOTION_SETUP.md 配置指南</li>
        </ul>
      </div>

      {/* 任务监控组件 */}
      <TaskMonitor />
    </div>
  );
}
