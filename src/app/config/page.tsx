'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiSettings, FiRotateCcw, FiShield, FiCheck, FiX } from 'react-icons/fi';
import { ConfigItem, ConfigCategory, ConfigUpdateRequest } from '@/types/config';

export default function ConfigPage() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [categories, setCategories] = useState<ConfigCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<Record<string, { valid: boolean; message: string; loading: boolean }>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/config');
      const data = await response.json();

      if (data.success) {
        setConfigItems(data.data.items);
        setCategories(data.data.categories);
        if (!activeCategory && data.data.categories.length > 0) {
          setActiveCategory(data.data.categories[0].id);
        }
      } else {
        setError(data.error || '获取配置失败');
      }
    } catch (err) {
      setError('获取配置失败');
      console.error('获取配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (id: string, value: any) => {
    setChanges(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      setError('没有需要保存的更改');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updates: ConfigUpdateRequest[] = Object.entries(changes).map(([id, value]) => ({
        id,
        value
      }));

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setChanges({});
        await fetchConfig(); // 重新获取配置

        if (data.data.restartRequired) {
          setSuccess(prev => prev + ' 注意：某些配置需要重启应用才能生效。');
        }
      } else {
        setError(data.error || '保存配置失败');
        if (data.details) {
          console.error('配置验证错误:', data.details);
        }
      }
    } catch (err) {
      setError('保存配置失败');
      console.error('保存配置失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要重置所有配置到默认值吗？此操作不可撤销。')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/config', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message + ' 请重启应用以使配置生效。');
        setChanges({});
        await fetchConfig();
      } else {
        setError(data.error || '重置配置失败');
      }
    } catch (err) {
      setError('重置配置失败');
      console.error('重置配置失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const validateConfig = async (id: string, value: any) => {
    // 只验证特定的配置项
    const validatableItems = ['NOTION_API_KEY', 'NOTION_DATABASE_ID', 'MIDSCENE_API_KEY', 'MIDSCENE_API_BASE'];
    if (!validatableItems.includes(id) || !value) {
      return;
    }

    setValidationStatus(prev => ({
      ...prev,
      [id]: { valid: false, message: '验证中...', loading: true }
    }));

    try {
      const response = await fetch('/api/config/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: id, value }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationStatus(prev => ({
          ...prev,
          [id]: {
            valid: data.data.valid,
            message: data.data.message,
            loading: false
          }
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [id]: {
            valid: false,
            message: data.error || '验证失败',
            loading: false
          }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [id]: {
          valid: false,
          message: '验证请求失败',
          loading: false
        }
      }));
    }
  };

  const getCurrentValue = (item: ConfigItem) => {
    return changes[item.id] !== undefined ? changes[item.id] : item.value;
  };

  const hasChanges = Object.keys(changes).length > 0;
  const currentCategoryItems = configItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <FiRefreshCw className="animate-spin" size={24} />
          <span className="text-lg">加载配置中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FiSettings className="text-blue-600" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">配置管理</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  {Object.keys(changes).length} 项待保存
                </span>
              )}
              
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="重置到默认值"
              >
                <FiRotateCcw size={16} />
                重置
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <FiRefreshCw className="animate-spin" size={16} />
                ) : (
                  <FiSave size={16} />
                )}
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误和成功消息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-red-600" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-600" size={20} />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 分类导航 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-medium text-gray-900">配置分类</h2>
              </div>
              <nav className="p-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 配置项 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                {categories.find(c => c.id === activeCategory) && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {categories.find(c => c.id === activeCategory)?.icon}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {categories.find(c => c.id === activeCategory)?.name}
                      </h2>
                      <p className="text-gray-600">
                        {categories.find(c => c.id === activeCategory)?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {currentCategoryItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {item.name}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {item.sensitive && (
                        <FiShield className="text-orange-500" size={14} title="敏感信息" />
                      )}
                      {item.restartRequired && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          需重启
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600">{item.description}</p>

                    {/* 输入控件 */}
                    <div className="relative">
                      {item.type === 'text' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={getCurrentValue(item)}
                              onChange={(e) => handleValueChange(item.id, e.target.value)}
                              placeholder={item.placeholder}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                ['NOTION_DATABASE_ID', 'MIDSCENE_API_BASE'].includes(item.id) ? 'pr-10' : ''
                              }`}
                            />
                            {['NOTION_DATABASE_ID', 'MIDSCENE_API_BASE'].includes(item.id) && getCurrentValue(item) && (
                              <button
                                type="button"
                                onClick={() => validateConfig(item.id, getCurrentValue(item))}
                                disabled={validationStatus[item.id]?.loading}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                title="验证配置"
                              >
                                {validationStatus[item.id]?.loading ? (
                                  <FiRefreshCw className="animate-spin" size={14} />
                                ) : (
                                  <FiCheck size={14} />
                                )}
                              </button>
                            )}
                          </div>

                          {/* 验证状态显示 */}
                          {validationStatus[item.id] && (
                            <div className={`flex items-center gap-2 text-sm ${
                              validationStatus[item.id].valid ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {validationStatus[item.id].loading ? (
                                <FiRefreshCw className="animate-spin" size={14} />
                              ) : validationStatus[item.id].valid ? (
                                <FiCheckCircle size={14} />
                              ) : (
                                <FiAlertCircle size={14} />
                              )}
                              <span>{validationStatus[item.id].message}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === 'password' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type={showPasswords[item.id] ? 'text' : 'password'}
                              value={getCurrentValue(item)}
                              onChange={(e) => handleValueChange(item.id, e.target.value)}
                              placeholder={item.placeholder}
                              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                              {['NOTION_API_KEY', 'NOTION_DATABASE_ID', 'MIDSCENE_API_KEY', 'MIDSCENE_API_BASE'].includes(item.id) && getCurrentValue(item) && (
                                <button
                                  type="button"
                                  onClick={() => validateConfig(item.id, getCurrentValue(item))}
                                  disabled={validationStatus[item.id]?.loading}
                                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                  title="验证配置"
                                >
                                  {validationStatus[item.id]?.loading ? (
                                    <FiRefreshCw className="animate-spin" size={14} />
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(item.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showPasswords[item.id] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* 验证状态显示 */}
                          {validationStatus[item.id] && (
                            <div className={`flex items-center gap-2 text-sm ${
                              validationStatus[item.id].valid ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {validationStatus[item.id].loading ? (
                                <FiRefreshCw className="animate-spin" size={14} />
                              ) : validationStatus[item.id].valid ? (
                                <FiCheckCircle size={14} />
                              ) : (
                                <FiAlertCircle size={14} />
                              )}
                              <span>{validationStatus[item.id].message}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === 'number' && (
                        <input
                          type="number"
                          value={getCurrentValue(item)}
                          onChange={(e) => handleValueChange(item.id, parseFloat(e.target.value) || 0)}
                          min={item.validation?.min}
                          max={item.validation?.max}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}

                      {item.type === 'boolean' && (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue(item)}
                            onChange={(e) => handleValueChange(item.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {getCurrentValue(item) ? '已启用' : '已禁用'}
                          </span>
                        </label>
                      )}

                      {item.type === 'select' && (
                        <select
                          value={getCurrentValue(item)}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {item.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {item.type === 'textarea' && (
                        <textarea
                          value={getCurrentValue(item)}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          placeholder={item.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* 验证信息 */}
                    {item.validation?.message && (
                      <p className="text-xs text-gray-500">{item.validation.message}</p>
                    )}

                    {/* 更改指示器 */}
                    {changes[item.id] !== undefined && (
                      <p className="text-xs text-orange-600">● 已修改，等待保存</p>
                    )}
                  </div>
                ))}

                {currentCategoryItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    此分类暂无配置项
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
