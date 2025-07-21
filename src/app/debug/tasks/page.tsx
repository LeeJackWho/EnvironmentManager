'use client';

import React, { useState } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiX, 
  FiCheck, 
  FiAlertCircle, 
  FiClock,
  FiRefreshCw,
  FiEye,
  FiTrash2,
  FiArrowLeft
} from 'react-icons/fi';
import Link from 'next/link';

interface LoginTask {
  id: string;
  siteId: string;
  siteName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  mode: 'midscene' | 'traditional';
  startTime: string;
  endTime?: string;
  progress: number;
  message: string;
  result?: any;
  error?: string;
}

interface TaskStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export default function TasksDebugPage() {
  const [tasks, setTasks] = useState<LoginTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LoginTask | null>(null);

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log('🔍 获取任务列表...');
      
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setStats(data.stats || stats);
        console.log(`✅ 任务列表获取成功: ${data.tasks?.length || 0}个任务`);
      } else {
        console.error('❌ 获取任务列表失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 获取任务列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 取消任务
  const cancelTask = async (taskId: string) => {
    try {
      console.log(`🚫 取消任务: ${taskId}`);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ 任务取消成功');
        await fetchTasks();
      } else {
        console.error('❌ 取消任务失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 取消任务错误:', error);
    }
  };

  // 清空所有任务
  const clearAllTasks = async () => {
    if (!confirm('确定要清空所有任务记录吗？')) return;
    
    try {
      console.log('🧹 清空所有任务...');
      const response = await fetch('/api/tasks', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ 任务清空成功');
        await fetchTasks();
      } else {
        console.error('❌ 清空任务失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 清空任务错误:', error);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'running':
        return <FiPlay className="text-blue-500" />;
      case 'completed':
        return <FiCheck className="text-green-500" />;
      case 'failed':
        return <FiAlertCircle className="text-red-500" />;
      case 'cancelled':
        return <FiX className="text-gray-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString();
  };

  // 计算执行时间
  const getExecutionTime = (task: LoginTask) => {
    const start = new Date(task.startTime).getTime();
    const end = task.endTime ? new Date(task.endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    return `${duration}秒`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/debug" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft />
            返回调试工具
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务监控工具</h1>
            <p className="text-gray-600 mt-1">手动查看和管理异步任务状态</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            刷新任务
          </button>
          <button
            onClick={clearAllTasks}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FiTrash2 />
            清空任务
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">总任务数</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          <div className="text-sm text-gray-600">运行中</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">已完成</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">失败</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-600">已取消</div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">任务列表</h2>
        </div>
        
        <div className="divide-y">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? '正在加载任务列表...' : '暂无任务'}
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <div className="font-medium">{task.siteName}</div>
                      <div className="text-sm text-gray-500">
                        {task.mode === 'midscene' ? 'Midscene模式' : '传统模式'} • 
                        开始时间: {formatTime(task.startTime)} • 
                        执行时间: {getExecutionTime(task)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{task.message}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                      {task.status === 'pending' && '等待中'}
                      {task.status === 'running' && '运行中'}
                      {task.status === 'completed' && '已完成'}
                      {task.status === 'failed' && '失败'}
                      {task.status === 'cancelled' && '已取消'}
                    </span>
                    
                    {(task.status === 'running' || task.status === 'pending') && (
                      <button
                        onClick={() => cancelTask(task.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="取消任务"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="查看详情"
                    >
                      <FiEye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">任务详情</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">任务ID</label>
                  <div className="font-mono text-sm">{selectedTask.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">网站名称</label>
                  <div>{selectedTask.siteName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">执行模式</label>
                  <div>{selectedTask.mode === 'midscene' ? 'Midscene模式' : '传统模式'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">当前状态</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTask.status)}
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">当前消息</label>
                <div className="bg-gray-50 p-3 rounded">{selectedTask.message}</div>
              </div>
              
              {selectedTask.error && (
                <div>
                  <label className="text-sm font-medium text-red-500">错误信息</label>
                  <div className="bg-red-50 p-3 rounded text-red-700">{selectedTask.error}</div>
                </div>
              )}
              
              {selectedTask.result && (
                <div>
                  <label className="text-sm font-medium text-gray-500">执行结果</label>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">💡 使用说明</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>手动刷新：</strong> 点击"刷新任务"按钮手动获取最新的任务状态</p>
          <p>• <strong>任务管理：</strong> 可以取消正在运行或等待中的任务</p>
          <p>• <strong>详情查看：</strong> 点击眼睛图标查看任务的详细信息和执行结果</p>
          <p>• <strong>清空记录：</strong> 点击"清空任务"可以删除所有任务记录</p>
          <p>• <strong>节省资源：</strong> 为了节省 Vercel 资源，任务状态不会自动刷新，需要手动刷新</p>
        </div>
      </div>
    </div>
  );
}
