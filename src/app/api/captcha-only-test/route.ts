import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { createMidsceneDirectClient } from '@/lib/midscene-direct';

/**
 * 仅测试验证码识别 API
 * 不进行登录操作，只识别验证码
 */
export async function POST(request: NextRequest) {
  let browser: any = null;
  let context: any = null;
  let page: any = null;

  try {
    console.log('🔍 开始验证码识别测试...');

    const body = await request.json();
    const { url, captchaType = '图形验证码' } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：url'
      }, { status: 400 });
    }

    console.log(`🌐 测试网站: ${url}`);
    console.log(`🛡️ 验证码类型: ${captchaType}`);

    // 创建会话目录
    const sessionId = `captcha_test_${Date.now()}`;
    const sessionDir = path.join(process.cwd(), '.browser-sessions', sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`📁 会话目录: ${sessionDir}`);

    // 启动浏览器
    browser = await chromium.launch({
      headless: false, // 显示浏览器窗口，方便调试
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // 访问网站
    console.log(`🌐 访问网站: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 初始截图
    const initialScreenshot = path.join(sessionDir, 'initial-page.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`📸 初始页面截图: ${initialScreenshot}`);

    // 初始化 Midscene 客户端
    const midsceneClient = createMidsceneDirectClient();
    await midsceneClient.initialize();

    // 执行验证码识别
    console.log('🤖 开始验证码识别...');
    const captchaResult = await midsceneClient.solveCaptchaDirectly(page, url, 2);

    // 最终截图
    const finalScreenshot = path.join(sessionDir, 'final-result.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`📸 最终结果截图: ${finalScreenshot}`);

    // 断开 Midscene 连接
    await midsceneClient.disconnect();

    console.log('✅ 验证码识别测试完成');

    return NextResponse.json({
      success: true,
      message: '验证码识别测试完成',
      data: {
        url,
        captchaType,
        sessionId,
        captchaResult,
        screenshots: {
          initial: initialScreenshot,
          final: finalScreenshot
        },
        executionSteps: captchaResult.executionSteps || [],
        summary: {
          detected: captchaResult.detected,
          solved: captchaResult.solved,
          type: captchaResult.type,
          solution: captchaResult.solution,
          retryCount: captchaResult.retryCount,
          message: captchaResult.message
        }
      }
    });

  } catch (error: any) {
    console.error('❌ 验证码识别测试失败:', error);

    return NextResponse.json({
      success: false,
      error: '验证码识别测试失败',
      details: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });

  } finally {
    // 清理资源
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (cleanupError) {
      console.warn('⚠️ 清理浏览器资源时出错:', cleanupError);
    }
  }
}

/**
 * 获取验证码测试历史记录
 */
export async function GET() {
  try {
    const sessionsDir = path.join(process.cwd(), '.browser-sessions');
    
    if (!fs.existsSync(sessionsDir)) {
      return NextResponse.json({
        success: true,
        data: {
          sessions: [],
          count: 0
        }
      });
    }

    const sessions = fs.readdirSync(sessionsDir)
      .filter(dir => dir.startsWith('captcha_test_'))
      .map(dir => {
        const sessionPath = path.join(sessionsDir, dir);
        const stats = fs.statSync(sessionPath);
        
        return {
          sessionId: dir,
          createdAt: stats.birthtime,
          path: sessionPath
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // 只返回最近10个会话

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });

  } catch (error: any) {
    console.error('❌ 获取测试历史失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取测试历史失败',
      details: {
        message: error.message
      }
    }, { status: 500 });
  }
}
