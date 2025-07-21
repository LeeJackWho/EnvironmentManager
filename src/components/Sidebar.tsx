'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiServer,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTool,
  FiSliders
} from 'react-icons/fi';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const menuItems: MenuItem[] = [
  // 暂时隐藏仪表板，因为功能还未完善
  // {
  //   name: '仪表板',
  //   href: '/',
  //   icon: FiHome,
  //   description: '系统概览和统计'
  // },
  {
    name: '环境管理',
    href: '/environments',
    icon: FiServer,
    description: '管理测试和生产环境'
  },
  {
    name: '配置管理',
    href: '/config',
    icon: FiSliders,
    description: '系统配置和API密钥管理'
  },
  // 暂时隐藏用户管理，因为功能还未实现
  // {
  //   name: '用户管理',
  //   href: '/users',
  //   icon: FiUsers,
  //   description: '管理用户账号和权限'
  // },
  // 暂时隐藏安全中心，因为功能还未实现
  // {
  //   name: '安全中心',
  //   href: '/security',
  //   icon: FiShield,
  //   description: '安全设置和日志'
  // },
  // 暂时隐藏数据分析，因为功能还未完善
  // {
  //   name: '数据分析',
  //   href: '/analytics',
  //   icon: FiBarChart,
  //   description: '登录统计和分析'
  // },
  // 数据库配置已移至配置管理，不再需要单独菜单
  // {
  //   name: '数据库配置',
  //   href: '/settings/database',
  //   icon: FiSettings,
  //   description: '配置 Notion API 和数据库'
  // },
  {
    name: '调试工具',
    href: '/debug',
    icon: FiTool,
    description: '配置检查和问题排查'
  }
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          flex flex-col shadow-lg lg:shadow-none
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiServer className="text-white" size={20} />
              </div>
              <span className="font-semibold text-gray-900 text-lg">环境管理系统</span>
            </div>
          )}
          
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <Icon
                  className={`${isActive ? 'text-blue-600' : 'text-gray-500'} w-6 h-6 flex-shrink-0`}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              <div>环境管理系统 v1.0.0</div>
              <div className="mt-1">基于 Next.js & Notion</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
