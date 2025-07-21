'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiX, 
  FiCheck, 
  FiAlertCircle, 
  FiClock,
  FiRefreshCw,
  FiEye,
  FiTrash2
} from 'react-icons/fi';

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

export default function TaskMonitor() {
  const [tasks, setTasks] = useState<LoginTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LoginTask | null>(null);

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  // 取消任务
  const cancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('取消任务失败:', error);
    }
  };

  // 手动刷新任务状态（调试模式）
  useEffect(() => {
    // 只在组件加载时获取一次任务列表
    fetchTasks();
  }, []);

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'running':
        return <FiRefreshCw className="text-blue-500 animate-spin" />;
      case 'completed':
        return <FiCheck className="text-green-500" />;
      case 'failed':
        return <FiAlertCircle className="text-red-500" />;
      case 'cancelled':
        return <FiX className="text-gray-500" />;
      default:
        return <FiClock className="text-gray-400" />;
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
    return new Date(timeString).toLocaleTimeString('zh-CN');
  };

  // 计算执行时间
  const getExecutionTime = (task: LoginTask) => {
    const start = new Date(task.startTime);
    const end = task.endTime ? new Date(task.endTime) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}秒`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分${diff % 60}秒`;
    return `${Math.floor(diff / 3600)}时${Math.floor((diff % 3600) / 60)}分`;
  };

  const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending');

  return (
    <>
      {/* 浮动任务监控按钮 */}
      {runningTasks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <FiRefreshCw className={runningTasks.length > 0 ? 'animate-spin' : ''} />
            <span className="bg-white text-blue-500 px-2 py-1 rounded-full text-xs font-bold">
              {runningTasks.length}
            </span>
          </button>
        </div>
      )}

      {/* 任务监控面板 */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">任务监控 (调试工具)</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-600">运行中: {stats.running}</span>
                  <span className="text-green-600">已完成: {stats.completed}</span>
                  <span className="text-red-600">失败: {stats.failed}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTasks}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  title="手动刷新任务列表"
                >
                  <FiRefreshCw size={14} />
                  刷新
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* 任务列表 */}
            <div className="overflow-y-auto max-h-96">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暂无任务
                </div>
              ) : (
                <div className="divide-y">
                  {tasks.map((task) => (
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
                      
                      {/* 进度条 */}
                      {task.status === 'running' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{task.message}</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
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
            
            <div className="p-4 space-y-4">
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
                  <label className="text-sm font-medium text-green-500">执行结果</label>
                  <div className="bg-green-50 p-3 rounded">
                    <pre className="text-sm">{JSON.stringify(selectedTask.result, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
