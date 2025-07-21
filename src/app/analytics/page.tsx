'use client';

import { FiBarChart, FiTrendingUp, FiPieChart, FiActivity } from 'react-icons/fi';

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-600 mt-1">登录统计和系统分析报告</p>
        </div>
      </div>

      {/* 功能开发中提示 */}
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FiBarChart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">数据分析功能</h2>
        <p className="text-gray-600 mb-6">此功能正在开发中，敬请期待</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiTrendingUp className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">登录趋势</h3>
            <p className="text-sm text-gray-600">分析登录成功率和趋势变化</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiPieChart className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">环境分布</h3>
            <p className="text-sm text-gray-600">查看各环境的使用情况分布</p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <FiActivity className="text-purple-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">性能监控</h3>
            <p className="text-sm text-gray-600">监控系统性能和响应时间</p>
          </div>
        </div>
      </div>
    </div>
  );
}
