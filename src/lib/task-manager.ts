/**
 * 异步任务管理器
 * 用于管理多个并发的自动登录任务
 */

export interface LoginTask {
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
  sessionDir?: string;
  browserPid?: number;
}

export interface TaskProgress {
  taskId: string;
  progress: number;
  message: string;
  status: LoginTask['status'];
  result?: any;
  error?: string;
}

class TaskManager {
  private tasks = new Map<string, LoginTask>();
  private listeners = new Set<(tasks: LoginTask[]) => void>();

  /**
   * 创建新任务
   */
  createTask(siteId: string, siteName: string, mode: 'midscene' | 'traditional'): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: LoginTask = {
      id: taskId,
      siteId,
      siteName,
      status: 'pending',
      mode,
      startTime: new Date().toISOString(),
      progress: 0,
      message: '任务已创建，等待开始...'
    };

    this.tasks.set(taskId, task);
    this.notifyListeners();
    
    console.log(`📋 创建任务: ${taskId} - ${siteName} (${mode})`);
    return taskId;
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId: string, update: Partial<LoginTask>): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ 任务不存在: ${taskId}`);
      return;
    }

    Object.assign(task, update);
    
    if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
      task.endTime = new Date().toISOString();
    }

    this.tasks.set(taskId, task);
    this.notifyListeners();
    
    console.log(`📊 更新任务: ${taskId} - ${update.status} (${update.progress || task.progress}%)`);
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): LoginTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): LoginTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  /**
   * 获取运行中的任务
   */
  getRunningTasks(): LoginTask[] {
    return this.getAllTasks().filter(task => 
      task.status === 'running' || task.status === 'pending'
    );
  }

  /**
   * 获取特定网站的运行中任务
   */
  getSiteRunningTasks(siteId: string): LoginTask[] {
    return this.getRunningTasks().filter(task => task.siteId === siteId);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ 任务不存在: ${taskId}`);
      return;
    }

    if (task.status === 'running' || task.status === 'pending') {
      this.updateTask(taskId, {
        status: 'cancelled',
        message: '任务已取消',
        progress: 0
      });
      
      console.log(`❌ 取消任务: ${taskId} - ${task.siteName}`);
    }
  }

  /**
   * 清理完成的任务
   */
  cleanupCompletedTasks(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
        task.endTime &&
        new Date(task.endTime) < cutoffTime
      ) {
        this.tasks.delete(taskId);
        console.log(`🧹 清理过期任务: ${taskId} - ${task.siteName}`);
      }
    }
    
    this.notifyListeners();
  }

  /**
   * 添加任务状态监听器
   */
  addListener(listener: (tasks: LoginTask[]) => void): () => void {
    this.listeners.add(listener);
    
    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const tasks = this.getAllTasks();
    this.listeners.forEach(listener => {
      try {
        listener(tasks);
      } catch (error) {
        console.error('❌ 任务监听器错误:', error);
      }
    });
  }

  /**
   * 获取任务统计
   */
  getTaskStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const tasks = this.getAllTasks();
    
    return {
      total: tasks.length,
      running: tasks.filter(t => t.status === 'running' || t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
  }

  /**
   * 检查是否可以启动新任务
   */
  canStartNewTask(siteId: string): { canStart: boolean; reason?: string } {
    const runningTasks = this.getRunningTasks();
    const siteRunningTasks = this.getSiteRunningTasks(siteId);
    
    // 检查全局并发限制
    if (runningTasks.length >= 5) {
      return {
        canStart: false,
        reason: '当前运行的任务过多，请等待其他任务完成'
      };
    }
    
    // 检查同一网站的并发限制
    if (siteRunningTasks.length >= 2) {
      return {
        canStart: false,
        reason: '该网站已有任务在运行，请等待完成或取消现有任务'
      };
    }
    
    return { canStart: true };
  }
}

// 全局任务管理器实例
export const taskManager = new TaskManager();

// 定期清理过期任务
if (typeof window !== 'undefined') {
  setInterval(() => {
    taskManager.cleanupCompletedTasks(24); // 清理24小时前的任务
  }, 60 * 60 * 1000); // 每小时检查一次
}
