import { NextResponse } from 'next/server';

/**
 * 健康检查 API
 * 用于检查系统配置和运行状态
 *
 * @returns {Promise<NextResponse>} 系统健康状态信息
 */
export async function GET() {
  try {
    // 检查环境变量是否配置
    const hasNotionConfig = !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID);
    
    // 检查系统时间
    const timestamp = new Date().toISOString();
    
    // 基础健康检查
    const healthStatus = {
      status: 'healthy',
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      notion: {
        configured: hasNotionConfig,
        apiKey: !!process.env.NOTION_API_KEY,
        databaseId: !!process.env.NOTION_DATABASE_ID,
      },
      features: {
        captcha: !!process.env.CAPTCHA_API_KEY,
      },
      uptime: process.uptime(),
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
