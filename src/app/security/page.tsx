'use client';

import { FiShield, FiLock, FiEye, FiAlertTriangle } from 'react-icons/fi';

export default function SecurityPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">安全中心</h1>
          <p className="text-gray-600 mt-1">系统安全设置和监控</p>
        </div>
      </div>

      {/* 功能开发中提示 */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FiShield className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">安全中心功能</h2>
        <p className="text-gray-600 mb-6">此功能正在开发中，敬请期待</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiLock className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">访问控制</h3>
            <p className="text-sm text-gray-600">管理API访问权限和安全策略</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiEye className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">安全监控</h3>
            <p className="text-sm text-gray-600">实时监控系统安全状态</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiAlertTriangle className="text-red-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">威胁检测</h3>
            <p className="text-sm text-gray-600">检测和防护安全威胁</p>
          </div>
        </div>
      </div>
    </div>
  );
}
