'use client';

import { FiUsers, FiPlus, FiEdit, FiShield } from 'react-icons/fi';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统用户账号和权限设置</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus />
          添加用户
        </button>
      </div>

      {/* 功能开发中提示 */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">用户管理功能</h2>
        <p className="text-gray-600 mb-6">此功能正在开发中，敬请期待</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiUsers className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">用户账号管理</h3>
            <p className="text-sm text-gray-600">创建、编辑和删除用户账号</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiShield className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">权限控制</h3>
            <p className="text-sm text-gray-600">设置用户访问权限和角色</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiEdit className="text-purple-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">活动日志</h3>
            <p className="text-sm text-gray-600">查看用户操作记录和日志</p>
          </div>
        </div>
      </div>
    </div>
  );
}
