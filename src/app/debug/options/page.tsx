'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiRefreshCw, FiCheck, FiX, FiSettings } from 'react-icons/fi';

interface OptionResult {
  Category: any[];
  CaptchaType: any[];
  Status: any[];
}

/**
 * 数据库选项检查页面
 * 用于检查和测试 Notion 数据库 Select 字段的选项配置
 */
export default function DatabaseOptionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptionResult | null>(null);
  const [error, setError] = useState<string>('');

  const checkOptions = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/database/options');
      const data = await response.json();

      if (data.success) {
        setResult(data.data.options);
      } else {
        setError(data.error || '检查失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('检查数据库选项失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'default': 'bg-gray-500',
      'gray': 'bg-gray-500',
      'brown': 'bg-amber-600',
      'orange': 'bg-orange-500',
      'yellow': 'bg-yellow-500',
      'green': 'bg-green-500',
      'blue': 'bg-blue-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'red': 'bg-red-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiSettings />
            数据库选项检查
          </h1>
          <p className="text-gray-600 mt-1">
            检查 Notion 数据库中 Select 字段的选项配置
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

      {/* 测试按钮 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">选项配置检查</h2>
            <p className="text-gray-600 mt-1">
              检查环境分类、验证码类型和状态字段的选项配置
            </p>
          </div>
          <button
            onClick={checkOptions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? '检查中...' : '开始检查'}
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <FiX />
              <span className="font-medium">检查失败</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* 检查结果 */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-800 mb-4">
              <FiCheck />
              <span className="font-medium">检查完成</span>
            </div>

            {/* 环境分类选项 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3">
                环境分类 (Category) - {result.Category.length} 个选项
              </h3>
              <div className="space-y-2">
                {result.Category.length > 0 ? (
                  result.Category.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${getColorClass(option.color)}`}></span>
                      <span className="text-blue-800 font-medium">{option.name}</span>
                      <span className="text-blue-600 text-sm">({option.color})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-red-600">⚠️ 未找到选项，请在 Notion 中配置</p>
                )}
              </div>
            </div>

            {/* 验证码类型选项 */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-3">
                验证码类型 (CaptchaType) - {result.CaptchaType.length} 个选项
              </h3>
              <div className="space-y-2">
                {result.CaptchaType.length > 0 ? (
                  result.CaptchaType.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${getColorClass(option.color)}`}></span>
                      <span className="text-green-800 font-medium">{option.name}</span>
                      <span className="text-green-600 text-sm">({option.color})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-red-600">⚠️ 未找到选项，请在 Notion 中配置</p>
                )}
              </div>
            </div>

            {/* 状态选项 */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-3">
                状态 (Status) - {result.Status.length} 个选项
              </h3>
              <div className="space-y-2">
                {result.Status.length > 0 ? (
                  result.Status.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${getColorClass(option.color)}`}></span>
                      <span className="text-purple-800 font-medium">{option.name}</span>
                      <span className="text-purple-600 text-sm">({option.color})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-red-600">⚠️ 未找到选项，请在 Notion 中配置</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-medium text-yellow-900 mb-3">📋 使用说明</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>• 此工具会检查 Notion 数据库中 Select 字段的选项配置</p>
          <p>• 确保字段名称为：Category、CaptchaType、Status</p>
          <p>• 如果选项为空，请在 Notion 数据库中添加相应的选项</p>
          <p>• 前端表单会自动使用这些选项，无需手动配置</p>
        </div>
      </div>
    </div>
  );
}
