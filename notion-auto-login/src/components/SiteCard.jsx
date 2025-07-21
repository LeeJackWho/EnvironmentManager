import { useState } from 'react';

export default function SiteCard({ site, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // 格式化上次登录时间
  const formatLastLogin = (dateString) => {
    if (!dateString) return '从未登录';
    
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case '已登录':
        return 'bg-green-100 text-green-800';
      case '登录失败':
        return 'bg-red-100 text-red-800';
      case '未登录':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 执行登录
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: site.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('登录成功');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || '登录失败');
      }
    } catch (error) {
      setError('请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 检查登录状态
  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: site.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(data.isLoggedIn ? '登录状态有效' : '登录已过期');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || '检查状态失败');
      }
    } catch (error) {
      setError('请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-800">{site.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
          {site.status}
        </span>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>上次登录: {formatLastLogin(site.lastLogin)}</p>
        {site.captchaType && site.captchaType !== '无' && (
          <p>验证码类型: {site.captchaType}</p>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          {message}
        </div>
      )}
      
      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm"
        >
          {loading ? '处理中...' : '登录'}
        </button>
        
        {site.status === '已登录' && (
          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 text-sm"
          >
            {loading ? '检查中...' : '检查状态'}
          </button>
        )}
        
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
        >
          访问网站
        </a>
      </div>
    </div>
  );
}
