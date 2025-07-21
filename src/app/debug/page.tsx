'use client';

import Link from 'next/link';
import { FiTool, FiDatabase, FiSettings, FiCheckCircle, FiMonitor, FiPlay, FiArrowLeft } from 'react-icons/fi';

/**
 * 调试工具主页面
 * 提供各种调试和配置检查工具的入口
 */
export default function DebugPage() {
  const debugTools = [
    {
      title: 'Notion 连接测试',
      description: '测试 Notion API 密钥和数据库连接状态',
      href: '/debug/test-notion',
      icon: FiCheckCircle,
      color: 'bg-green-500'
    },
    {
      title: '数据库结构检查',
      description: '检查 Notion 数据库字段配置是否正确',
      href: '/debug/database',
      icon: FiDatabase,
      color: 'bg-blue-500'
    },
    {
      title: '数据库选项检查',
      description: '检查 Select 字段的选项配置和动态获取',
      href: '/debug/options',
      icon: FiSettings,
      color: 'bg-purple-500'
    },
    {
      title: '登录调试工具',
      description: '详细分析页面结构，逐步调试自动登录过程，包含截图和日志',
      href: '/debug/login-debug',
      icon: FiTool,
      color: 'bg-orange-500'
    },
    {
      title: '自动登录测试',
      description: '完整的自动登录功能测试，包含持久化浏览器会话',
      href: '/debug/simple-auto-login',
      icon: FiPlay,
      color: 'bg-blue-600'
    },
    {
      title: '简单持久化测试',
      description: '基础的浏览器持久化功能测试，验证浏览器独立运行',
      href: '/debug/simple-test',
      icon: FiMonitor,
      color: 'bg-green-600'
    },
    {
      title: '持久化登录功能测试',
      description: '测试完整的持久化登录流程，验证自动元素识别和填写功能',
      href: '/debug/test-persistent-login',
      icon: FiMonitor,
      color: 'bg-indigo-600'
    },
    {
      title: '增强自动登录测试',
      description: '根据验证码类型采用不同处理策略的智能自动登录测试',
      href: '/debug/enhanced-auto-login',
      icon: FiSettings,
      color: 'bg-purple-600'
    },
    {
      title: '任务监控工具',
      description: '手动查看和管理异步任务状态，调试任务执行情况',
      href: '/debug/tasks',
      icon: FiMonitor,
      color: 'bg-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiTool />
          调试工具
        </h1>
        <p className="text-gray-600 mt-1">
          用于检查系统配置、测试连接状态和排查问题的调试工具集合
        </p>
      </div>

      {/* 工具卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debugTools.map((tool, index) => (
          <Link
            key={index}
            href={tool.href}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${tool.color} text-white`}>
                  <tool.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <FiSettings />
          使用说明
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Notion 连接测试：</strong> 验证 API 密钥是否有效，数据库是否可访问，并测试基本的增删改查操作。</p>
          <p><strong>数据库结构检查：</strong> 检查 Notion 数据库是否包含所有必需的字段，字段类型是否正确。</p>
          <p><strong>登录调试工具：</strong> 详细分析页面结构，逐步调试自动登录过程，包含截图和详细日志。</p>
          <p><strong>自动登录测试：</strong> 完整的自动登录功能测试，包含持久化浏览器会话。</p>
          <p><strong>简单持久化测试：</strong> 基础的浏览器持久化功能测试，验证浏览器独立运行。</p>
          <p><strong>任务监控工具：</strong> 手动查看和管理异步任务状态，节省 Vercel 资源的调试工具。</p>
          <p className="mt-4 p-3 bg-blue-100 rounded">
            <strong>💡 提示：</strong> 如果遇到连接问题，请先运行 &ldquo;Notion 连接测试&rdquo; 来确认基本配置是否正确。对于自动登录问题，建议先用&ldquo;简单持久化测试&rdquo;验证基础功能，再用&ldquo;登录调试工具&rdquo;分析具体问题。任务监控工具采用手动刷新模式，适合 Vercel 零成本部署。
          </p>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-medium text-yellow-900 mb-3">🔧 常见问题</h3>
        <div className="text-sm text-yellow-800 space-y-3">
          <div>
            <p className="font-medium">Q: API 密钥无效怎么办？</p>
            <p>A: 检查 .env.local 文件中的 NOTION_API_KEY 是否正确，确保以 "ntn_" 开头。</p>
          </div>
          <div>
            <p className="font-medium">Q: 数据库不存在或无权限访问？</p>
            <p>A: 确保集成已添加到数据库的连接中，并且有足够的权限。</p>
          </div>
          <div>
            <p className="font-medium">Q: 字段配置错误？</p>
            <p>A: 使用 "数据库结构检查" 工具查看具体缺失的字段，并在 Notion 中创建对应字段。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
