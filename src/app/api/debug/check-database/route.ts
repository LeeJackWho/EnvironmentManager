import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { checkEnvConfig, debugEnvVars } from '@/lib/env';

/**
 * 数据库结构检查API
 * 检查Notion数据库是否包含所有必需的字段，字段类型是否正确
 */
export async function GET() {
  try {
    // 调试环境变量
    debugEnvVars();
    
    // 检查环境变量配置
    const envConfig = checkEnvConfig();
    
    if (!envConfig.isValid) {
      console.error('❌ 数据库检查 - 环境变量配置错误:', envConfig.errors);
      return NextResponse.json({
        success: false,
        error: '环境变量配置错误',
        details: {
          errors: envConfig.errors,
          hasApiKey: !!envConfig.apiKey,
          hasDatabaseId: !!envConfig.databaseId
        }
      }, { status: 500 });
    }

    const { apiKey, databaseId } = envConfig;

    // 初始化 Notion 客户端
    const notion = new Client({
      auth: apiKey!,
      timeoutMs: 15000,
    });

    console.log('🔍 开始检查数据库结构...');

    // 获取数据库信息
    const databaseInfo = await notion.databases.retrieve({
      database_id: databaseId!
    });

    console.log('✅ 数据库信息获取成功');

    // 定义必需的字段配置
    const requiredFields = [
      { name: 'Name', type: 'title', required: true },
      { name: 'URL', type: 'url', required: true },
      { name: 'Username', type: 'rich_text', required: true },
      { name: 'Password', type: 'rich_text', required: true },
      { name: 'Category', type: 'select', required: true },
      { name: 'CaptchaType', type: 'select', required: true },
      { name: 'Status', type: 'status', required: true },
      { name: 'Cookies', type: 'rich_text', required: false },
      { name: 'Description', type: 'rich_text', required: false }
    ];

    // 检查字段匹配情况
    const fieldMapping = [];
    const missingFields = [];
    const properties = databaseInfo.properties;

    for (const requiredField of requiredFields) {
      const foundField = properties[requiredField.name];
      
      if (foundField) {
        const typeMatch = foundField.type === requiredField.type;
        fieldMapping.push({
          required: requiredField.name,
          expectedType: requiredField.type,
          found: true,
          matched: {
            name: requiredField.name,
            type: foundField.type,
            typeMatch: typeMatch
          }
        });

        if (!typeMatch) {
          console.warn(`⚠️ 字段类型不匹配: ${requiredField.name} (期望: ${requiredField.type}, 实际: ${foundField.type})`);
        }
      } else {
        fieldMapping.push({
          required: requiredField.name,
          expectedType: requiredField.type,
          found: false,
          matched: null
        });

        if (requiredField.required) {
          missingFields.push({
            required: requiredField.name,
            expectedType: requiredField.type
          });
        }
      }
    }

    // 统计信息
    const totalFields = Object.keys(properties).length;
    const matchedFields = fieldMapping.filter(f => f.found).length;
    const correctTypeFields = fieldMapping.filter(f => f.found && f.matched?.typeMatch).length;

    // 生成建议
    let suggestions = {
      message: '数据库配置完美！所有必需字段都已正确配置。'
    };

    if (missingFields.length > 0) {
      suggestions.message = `发现 ${missingFields.length} 个缺失的必需字段，请在 Notion 数据库中添加这些字段。`;
    } else if (correctTypeFields < matchedFields) {
      suggestions.message = `所有字段都存在，但有 ${matchedFields - correctTypeFields} 个字段的类型不正确，请检查字段类型配置。`;
    }

    // 获取字段选项信息（用于Select和Status字段）
    const fieldOptions: Record<string, any> = {};
    
    ['Category', 'CaptchaType', 'Status'].forEach(fieldName => {
      const field = properties[fieldName];
      if (field) {
        if (field.type === 'select' && field.select?.options) {
          fieldOptions[fieldName] = {
            type: 'select',
            options: field.select.options.map((opt: any) => ({
              id: opt.id,
              name: opt.name,
              color: opt.color
            }))
          };
        } else if (field.type === 'status' && field.status?.options) {
          fieldOptions[fieldName] = {
            type: 'status',
            options: field.status.options.map((opt: any) => ({
              id: opt.id,
              name: opt.name,
              color: opt.color
            }))
          };
        }
      }
    });

    console.log('✅ 数据库结构检查完成');

    return NextResponse.json({
      success: true,
      database: {
        id: databaseInfo.id,
        title: databaseInfo.title?.[0]?.plain_text || 'Untitled',
        created_time: databaseInfo.created_time,
        last_edited_time: databaseInfo.last_edited_time,
        url: databaseInfo.url
      },
      fields: {
        total: totalFields,
        matched: matchedFields,
        correctType: correctTypeFields,
        mapping: fieldMapping,
        missingFields: missingFields,
        options: fieldOptions
      },
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ 数据库结构检查失败:', error);
    
    let errorMessage = '数据库结构检查失败';
    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 密钥无效或权限不足';
    } else if (error.code === 'object_not_found') {
      errorMessage = '数据库不存在或无权限访问';
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Notion API 连接超时';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
