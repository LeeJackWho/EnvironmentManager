import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';
import { getSiteById } from '@/lib/notion-client';

/**
 * 异步启动环境测试
 * POST /api/environments/[id]/test-async
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 收到异步测试请求:', params.id);
    
    const { mode = 'traditional' } = await request.json();
    const siteId = params.id;

    console.log(`📋 测试参数: siteId=${siteId}, mode=${mode}`);

    // 获取网站信息
    const site = await getSiteById(siteId);
    if (!site) {
      console.log(`❌ 网站不存在: ${siteId}`);
      return NextResponse.json(
        { 
          success: false,
          error: '网站不存在或无权限访问' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ 找到网站: ${site.name}`);

    // 检查是否可以启动新任务
    const canStart = taskManager.canStartNewTask(siteId);
    if (!canStart.canStart) {
      console.log(`⚠️ 无法启动新任务: ${canStart.reason}`);
      return NextResponse.json(
        { 
          success: false,
          error: canStart.reason 
        },
        { status: 429 }
      );
    }

    // 创建异步任务
    const taskId = taskManager.createTask(
      siteId,
      site.name,
      mode
    );

    console.log(`✅ 任务创建成功: ${taskId}`);

    // 异步执行登录测试
    executeLoginTest(taskId, site, mode).catch(error => {
      console.error(`❌ 任务执行失败: ${taskId}`, error);
      taskManager.updateTask(taskId, {
        status: 'failed',
        progress: 0,
        message: `执行失败: ${error.message}`,
        error: error.message
      });
    });

    return NextResponse.json({
      success: true,
      taskId,
      message: `${mode === 'midscene' ? 'Midscene' : '传统'}模式测试已启动`,
      site: {
        id: site.id,
        name: site.name,
        url: site.url
      }
    });

  } catch (error: any) {
    console.error('❌ 启动异步测试失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '启动测试失败: ' + error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * 执行登录测试的异步函数
 */
async function executeLoginTest(taskId: string, site: any, mode: string) {
  try {
    console.log(`🚀 开始执行登录测试: ${taskId}, 模式: ${mode}`);
    
    // 更新任务状态为运行中
    taskManager.updateTask(taskId, {
      status: 'running',
      progress: 10,
      message: '正在准备登录测试...'
    });

    // 选择对应的登录API
    let apiEndpoint = '/api/traditional-auto-login';
    if (mode === 'midscene') {
      apiEndpoint = '/api/enhanced-auto-login';
    }

    taskManager.updateTask(taskId, {
      progress: 20,
      message: `正在调用${mode === 'midscene' ? 'Midscene' : '传统'}登录API...`
    });

    // 构造请求数据
    const requestData = {
      name: site.name,
      url: site.url,
      username: site.username,
      password: site.password,
      captchaType: site.captchaType || '无',
      notes: `异步任务测试 - ${site.name}`
    };

    console.log(`📡 调用登录API: ${apiEndpoint}`);

    // 调用登录API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    taskManager.updateTask(taskId, {
      progress: 80,
      message: '正在处理登录结果...'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ 登录测试成功: ${taskId}`);
      taskManager.updateTask(taskId, {
        status: 'completed',
        progress: 100,
        message: '登录测试完成！',
        result: {
          success: true,
          loginTime: new Date().toISOString(),
          cookies: result.cookies || null,
          mode: mode,
          details: result
        }
      });
    } else {
      console.log(`❌ 登录测试失败: ${taskId}`, result);
      taskManager.updateTask(taskId, {
        status: 'failed',
        progress: 100,
        message: `登录失败: ${result.error || '未知错误'}`,
        error: result.error || '登录API返回失败'
      });
    }

  } catch (error: any) {
    console.error(`❌ 执行登录测试失败: ${taskId}`, error);
    taskManager.updateTask(taskId, {
      status: 'failed',
      progress: 0,
      message: `执行失败: ${error.message}`,
      error: error.message
    });
  }
}
