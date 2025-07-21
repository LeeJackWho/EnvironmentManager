'use client';

import { FiSettings, FiDatabase, FiKey, FiGlobe } from 'react-icons/fi';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-1">配置系统参数和偏好设置</p>
        </div>
      </div>

      {/* 功能开发中提示 */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FiSettings className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">系统设置功能</h2>
        <p className="text-gray-600 mb-6">此功能正在开发中，敬请期待</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiDatabase className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">数据库配置</h3>
            <p className="text-sm text-gray-600">管理 Notion 数据库连接设置</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiKey className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">API 密钥</h3>
            <p className="text-sm text-gray-600">管理各种服务的 API 密钥</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiGlobe className="text-purple-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">全局设置</h3>
            <p className="text-sm text-gray-600">配置系统全局参数和偏好</p>
          </div>
        </div>
      </div>

      {/* 当前配置状态 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">当前配置状态</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notion API</h4>
              <p className="text-sm text-gray-600">数据库连接状态</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              已配置
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">验证码服务</h4>
              <p className="text-sm text-gray-600">第三方验证码识别服务</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              可选配置
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">系统环境</h4>
              <p className="text-sm text-gray-600">当前运行环境</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              开发环境
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
