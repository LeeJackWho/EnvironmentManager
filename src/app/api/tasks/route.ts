import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

/**
 * 获取所有任务状态
 * GET /api/tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const siteId = searchParams.get('siteId');

    let tasks = taskManager.getAllTasks();

    // 按状态过滤
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    // 按网站过滤
    if (siteId) {
      tasks = tasks.filter(task => task.siteId === siteId);
    }

    // 获取统计信息
    const stats = taskManager.getTaskStats();

    return NextResponse.json({
      success: true,
      tasks,
      stats,
      total: tasks.length
    });

  } catch (error) {
    console.error('❌ 获取任务列表失败:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}
