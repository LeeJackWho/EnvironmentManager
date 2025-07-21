import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

/**
 * 获取单个任务状态
 * GET /api/tasks/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('❌ 获取任务状态失败:', error);
    return NextResponse.json(
      { error: '获取任务状态失败' },
      { status: 500 }
    );
  }
}

/**
 * 取消任务
 * DELETE /api/tasks/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    if (task.status !== 'running' && task.status !== 'pending') {
      return NextResponse.json(
        { error: '只能取消运行中或等待中的任务' },
        { status: 400 }
      );
    }

    taskManager.cancelTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已取消'
    });

  } catch (error) {
    console.error('❌ 取消任务失败:', error);
    return NextResponse.json(
      { error: '取消任务失败' },
      { status: 500 }
    );
  }
}
