import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { checkEnvConfig } from '@/lib/env';

// 缓存配置
let optionsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取数据库字段选项 API
 * 动态获取 Notion 数据库中 Select 字段的所有选项
 * 增加缓存、重试机制和更好的错误处理
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🔍 开始获取数据库字段选项...');

    // 检查缓存
    const now = Date.now();
    if (optionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`✅ 使用缓存数据 (${Math.round((now - cacheTimestamp) / 1000)}秒前)`);
      return NextResponse.json({
        success: true,
        data: optionsCache,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000)
      });
    }

    // 检查环境变量配置
    const envConfig = checkEnvConfig();

    if (!envConfig.isValid) {
      console.error('❌ 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '缺少环境变量配置',
        details: {
          errors: envConfig.errors,
          hasApiKey: !!envConfig.apiKey,
          hasDatabaseId: !!envConfig.databaseId
        }
      }, { status: 500 });
    }

    const { apiKey, databaseId } = envConfig;

    // 获取数据库选项（带重试机制）
    const options = await getDatabaseOptionsWithRetry(apiKey!, databaseId!, 3);

    // 更新缓存
    optionsCache = options;
    cacheTimestamp = now;

    const duration = Date.now() - startTime;
    console.log(`✅ 获取数据库选项成功 (${duration}ms)`);

    return NextResponse.json({
      success: true,
      data: options,
      cached: false,
      duration
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ 获取数据库选项失败 (${duration}ms):`, error);

    let errorMessage = '获取数据库选项失败';
    let statusCode = 500;

    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 密钥无效或权限不足';
      statusCode = 401;
    } else if (error.code === 'object_not_found') {
      errorMessage = '数据库不存在或无权限访问';
      statusCode = 404;
    } else if (error.name === 'TimeoutError' || error.code === 'ECONNRESET') {
      errorMessage = 'Notion API 连接超时，请稍后重试';
      statusCode = 408;
    } else if (error.code === 'rate_limited') {
      errorMessage = 'API 请求频率过高，请稍后重试';
      statusCode = 429;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code,
        duration,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: statusCode });
  }
}

/**
 * 带重试机制的数据库选项获取
 */
async function getDatabaseOptionsWithRetry(apiKey: string, databaseId: string, maxRetries: number): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 尝试获取数据库选项 (第${attempt}次)`);

      // 初始化 Notion 客户端，每次重试使用更长的超时时间
      const timeoutMs = 10000 + (attempt - 1) * 5000; // 10s, 15s, 20s
      const notion = new Client({
        auth: apiKey,
        timeoutMs,
      });

      // 获取数据库结构信息
      const databaseInfo = await notion.databases.retrieve({
        database_id: databaseId
      });

      const properties = databaseInfo.properties as Record<string, any>;

      // 提取 Select 字段的选项
      const options = {
        Category: [],
        CaptchaType: [],
        Status: []
      };

      // 获取环境分类选项
      if (properties['Category'] && properties['Category'].type === 'select') {
        options.Category = properties['Category'].select.options.map((option: any) => ({
          id: option.id,
          name: option.name,
          color: option.color
        }));
      }

      // 获取验证码类型选项
      if (properties['CaptchaType'] && properties['CaptchaType'].type === 'select') {
        options.CaptchaType = properties['CaptchaType'].select.options.map((option: any) => ({
          id: option.id,
          name: option.name,
          color: option.color
        }));
      }

      // 获取状态选项
      if (properties['Status']) {
        if (properties['Status'].type === 'select') {
          options.Status = properties['Status'].select.options.map((option: any) => ({
            id: option.id,
            name: option.name,
            color: option.color
          }));
        } else if (properties['Status'].type === 'status') {
          options.Status = properties['Status'].status.options.map((option: any) => ({
            id: option.id,
            name: option.name,
            color: option.color
          }));
        }
      }

      console.log(`✅ 数据库选项获取成功 (第${attempt}次):`, {
        Category: options.Category.length,
        CaptchaType: options.CaptchaType.length,
        Status: options.Status.length
      });

      return {
        options,
        fieldTypes: {
          Category: properties['Category']?.type || 'unknown',
          CaptchaType: properties['CaptchaType']?.type || 'unknown',
          Status: properties['Status']?.type || 'unknown'
        },
        attempt
      };

    } catch (error: any) {
      lastError = error;
      console.error(`❌ 第${attempt}次尝试失败:`, {
        message: error.message,
        code: error.code,
        attempt,
        maxRetries
      });

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败了
  throw lastError;
}
