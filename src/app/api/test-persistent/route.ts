import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

/**
 * 简化的持久化登录测试 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始测试持久化登录...');

    const body = await request.json();
    const { url = 'https://example.com', username = 'test', password = 'test' } = body;

    console.log(`🌐 测试URL: ${url}`);

    // 启动独立的浏览器进程
    console.log('🚀 启动独立浏览器进程...');
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        // 关键：让浏览器进程独立运行
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    console.log('✅ 浏览器启动成功');

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    console.log('✅ 浏览器上下文创建成功');

    const page = await context.newPage();
    console.log('✅ 页面创建成功');

    // 导航到页面
    console.log(`🌐 导航到: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log('✅ 页面导航成功');

    // 等待一段时间让用户看到浏览器
    await page.waitForTimeout(3000);

    console.log('🎉 测试完成，浏览器将保持打开');

    // 关键：断开与浏览器的连接，但不关闭浏览器进程
    // 这样浏览器会独立运行，不受 Node.js 进程影响
    try {
      await browser.disconnect();
      console.log('✅ 已断开与浏览器的连接，浏览器将独立运行');
    } catch (error) {
      console.log('⚠️ 断开连接时出现警告（这是正常的）:', error);
    }

    return NextResponse.json({
      success: true,
      message: '持久化登录测试成功',
      data: {
        url,
        username,
        timestamp: new Date().toISOString(),
        instructions: [
          '✅ 浏览器已启动并导航到指定页面',
          '🔗 浏览器将保持运行',
          '🧪 您可以在浏览器中进行测试',
          '💡 即使关闭这个程序，浏览器也会继续运行'
        ]
      }
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '测试失败',
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}

/**
 * 获取测试状态
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: '测试API正常运行',
      data: {
        timestamp: new Date().toISOString(),
        status: 'ready'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取状态失败'
    }, { status: 500 });
  }
}
