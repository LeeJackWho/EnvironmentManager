import { NextRequest, NextResponse } from 'next/server';
import { BrowserPool } from '@/lib/browser-pool';

/**
 * 浏览器池预热 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 1, headless = false } = body;

    console.log(`🔥 开始预热浏览器池，创建 ${count} 个实例...`);

    const browserPool = BrowserPool.getInstance();
    
    // 预热浏览器池
    await browserPool.warmUp(count, headless);
    
    // 获取池状态
    const status = browserPool.getPoolStatus();

    return NextResponse.json({
      success: true,
      message: `浏览器池预热完成，创建了 ${count} 个实例`,
      data: {
        poolStatus: status,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('浏览器池预热失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '浏览器池预热失败'
    }, { status: 500 });
  }
}

/**
 * 获取浏览器池状态 API
 */
export async function GET() {
  try {
    const browserPool = BrowserPool.getInstance();
    const status = browserPool.getPoolStatus();

    return NextResponse.json({
      success: true,
      data: {
        poolStatus: status,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('获取浏览器池状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取浏览器池状态失败'
    }, { status: 500 });
  }
}

/**
 * 清理浏览器池 API
 */
export async function DELETE() {
  try {
    const browserPool = BrowserPool.getInstance();
    await browserPool.closeAll();

    return NextResponse.json({
      success: true,
      message: '浏览器池已清理',
      data: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('清理浏览器池失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '清理浏览器池失败'
    }, { status: 500 });
  }
}
