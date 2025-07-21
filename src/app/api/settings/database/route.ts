import { NextRequest, NextResponse } from 'next/server';
import { getNotionApiKey, getNotionDatabaseId } from '@/lib/env';
import fs from 'fs';
import path from 'path';

/**
 * 获取数据库配置
 */
export async function GET() {
  try {
    const apiKey = getNotionApiKey();
    const databaseId = getNotionDatabaseId();

    console.log('📖 读取数据库配置:', {
      hasApiKey: !!apiKey,
      hasDatabaseId: !!databaseId,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      databaseId: databaseId || 'none'
    });

    return NextResponse.json({
      success: true,
      config: {
        apiKey: apiKey || '', // 返回完整的API Key供编辑
        databaseId: databaseId || '',
        hasApiKey: !!apiKey,
        hasDatabaseId: !!databaseId
      }
    });
  } catch (error) {
    console.error('获取数据库配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 });
  }
}

/**
 * 保存数据库配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, databaseId, preserveOtherEnvVars = true } = body;

    if (!apiKey || !databaseId) {
      return NextResponse.json({
        success: false,
        error: 'API Key 和数据库 ID 都是必填项'
      }, { status: 400 });
    }

    // 验证 API Key 格式
    if (!apiKey.startsWith('ntn_')) {
      return NextResponse.json({
        success: false,
        error: 'API Key 格式错误，应该以 "ntn_" 开头'
      }, { status: 400 });
    }

    // 验证数据库 ID 格式（32位字符串）
    if (!/^[a-f0-9]{32}$/i.test(databaseId.replace(/-/g, ''))) {
      return NextResponse.json({
        success: false,
        error: '数据库 ID 格式错误，应该是32位字符串'
      }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    // 如果需要保留其他环境变量，先读取现有内容
    if (preserveOtherEnvVars && fs.existsSync(envPath)) {
      try {
        const existingContent = fs.readFileSync(envPath, 'utf8');
        const lines = existingContent.split('\n');
        const updatedLines: string[] = [];
        let foundNotionApiKey = false;
        let foundNotionDatabaseId = false;

        // 更新现有的 Notion 配置，保留其他配置
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('NOTION_API_KEY=')) {
            updatedLines.push(`NOTION_API_KEY=${apiKey}`);
            foundNotionApiKey = true;
          } else if (trimmedLine.startsWith('NOTION_DATABASE_ID=')) {
            updatedLines.push(`NOTION_DATABASE_ID=${databaseId}`);
            foundNotionDatabaseId = true;
          } else {
            updatedLines.push(line);
          }
        }

        // 如果没有找到 Notion 配置，添加到文件末尾
        if (!foundNotionApiKey || !foundNotionDatabaseId) {
          updatedLines.push('');
          updatedLines.push('# Notion API 配置');
          if (!foundNotionApiKey) {
            updatedLines.push(`NOTION_API_KEY=${apiKey}`);
          }
          if (!foundNotionDatabaseId) {
            updatedLines.push(`NOTION_DATABASE_ID=${databaseId}`);
          }
        }

        envContent = updatedLines.join('\n');
      } catch (error) {
        console.warn('读取现有 .env.local 失败，将创建新文件:', error);
        // 如果读取失败，使用默认模板
        envContent = createDefaultEnvContent(apiKey, databaseId);
      }
    } else {
      // 创建新的环境变量文件
      envContent = createDefaultEnvContent(apiKey, databaseId);
    }

    // 写入 .env.local 文件
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('✅ 数据库配置已保存到 .env.local');

    // 更新运行时环境变量（仅在开发环境中）
    if (process.env.NODE_ENV === 'development') {
      // 动态更新环境变量
      const envKeys = ['NOTION_API_KEY', 'NOTION_DATABASE_ID'];
      const envValues = [apiKey, databaseId];

      for (let i = 0; i < envKeys.length; i++) {
        process.env[envKeys[i]] = envValues[i];
      }
    }

    return NextResponse.json({
      success: true,
      message: '配置保存成功！环境变量已更新。',
      needsRestart: process.env.NODE_ENV === 'development'
    });

  } catch (error) {
    console.error('保存数据库配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '保存配置失败: ' + (error as Error).message
    }, { status: 500 });
  }
}

/**
 * 创建默认的环境变量内容
 */
function createDefaultEnvContent(apiKey: string, databaseId: string): string {
  return `# Notion API 配置
NOTION_API_KEY=${apiKey}
NOTION_DATABASE_ID=${databaseId}

# 验证码识别API（可选）
CAPTCHA_API_KEY=your_captcha_api_key_here

# 环境配置
NODE_ENV=development
`;
}
