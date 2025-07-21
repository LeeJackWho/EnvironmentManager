import { NextRequest, NextResponse } from 'next/server';

/**
 * 配置验证 API
 * 验证 Notion API 连接和 Midscene API 密钥等配置
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始配置验证...');

    const body = await request.json();
    const { type, value } = body;

    if (!type || value === undefined) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：type, value'
      }, { status: 400 });
    }

    let validationResult;

    switch (type) {
      case 'NOTION_API_KEY':
        validationResult = await validateNotionApiKey(value);
        break;
      case 'NOTION_DATABASE_ID':
        validationResult = await validateNotionDatabaseId(value);
        break;
      case 'MIDSCENE_API_KEY':
        validationResult = await validateMidsceneApiKey(value);
        break;
      case 'MIDSCENE_API_BASE':
        validationResult = await validateMidsceneApiBase(value);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的验证类型'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: validationResult
    });

  } catch (error) {
    console.error('❌ 配置验证失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '配置验证失败'
    }, { status: 500 });
  }
}

/**
 * 验证 Notion API Key
 */
async function validateNotionApiKey(apiKey: string) {
  try {
    if (!apiKey || !apiKey.startsWith('secret_')) {
      return {
        valid: false,
        message: 'API Key 格式不正确，应以 secret_ 开头'
      };
    }

    // 尝试调用 Notion API
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return {
        valid: true,
        message: 'Notion API Key 验证成功',
        details: {
          user: userData.name || userData.id,
          type: userData.type
        }
      };
    } else {
      const errorData = await response.json();
      return {
        valid: false,
        message: `Notion API 验证失败: ${errorData.message || response.statusText}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: `Notion API 连接失败: ${error}`
    };
  }
}

/**
 * 验证 Notion 数据库 ID
 */
async function validateNotionDatabaseId(databaseId: string) {
  try {
    if (!databaseId || databaseId.length !== 32) {
      return {
        valid: false,
        message: '数据库 ID 格式不正确，应为 32 位字符'
      };
    }

    // 获取当前的 API Key
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return {
        valid: false,
        message: '请先配置 Notion API Key'
      };
    }

    // 尝试访问数据库
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const databaseData = await response.json();
      return {
        valid: true,
        message: '数据库访问成功',
        details: {
          title: databaseData.title?.[0]?.plain_text || '未命名数据库',
          properties: Object.keys(databaseData.properties || {}).length
        }
      };
    } else {
      const errorData = await response.json();
      return {
        valid: false,
        message: `数据库访问失败: ${errorData.message || response.statusText}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: `数据库连接失败: ${error}`
    };
  }
}

/**
 * 验证 Midscene API Key
 */
async function validateMidsceneApiKey(apiKey: string) {
  try {
    if (!apiKey) {
      return {
        valid: false,
        message: 'API Key 不能为空'
      };
    }

    // 注意：这里是模拟验证，因为我们使用的是模拟的 Midscene 客户端
    // 在真实环境中，这里应该调用 Midscene.js 的验证 API

    // 模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 简单的格式验证
    if (apiKey.length < 10) {
      return {
        valid: false,
        message: 'API Key 长度不足，请检查是否完整'
      };
    }

    // 模拟成功验证
    return {
      valid: true,
      message: 'Midscene API Key 验证成功（模拟模式）',
      details: {
        mode: 'simulation',
        note: '当前使用模拟模式，实际部署时需要真实的 API Key'
      }
    };

  } catch (error) {
    return {
      valid: false,
      message: `Midscene API 验证失败: ${error}`
    };
  }
}

/**
 * 验证 Midscene API Base URL
 */
async function validateMidsceneApiBase(apiBase: string) {
  try {
    if (!apiBase) {
      return {
        valid: false,
        message: 'API Base URL 不能为空'
      };
    }

    // URL 格式验证
    try {
      const url = new URL(apiBase);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return {
          valid: false,
          message: 'API Base URL 必须使用 HTTP 或 HTTPS 协议'
        };
      }
    } catch (urlError) {
      return {
        valid: false,
        message: 'API Base URL 格式不正确'
      };
    }

    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      valid: true,
      message: 'API Base URL 格式正确（模拟验证）',
      details: {
        url: apiBase,
        note: '当前为模拟验证，实际部署时会测试真实连接'
      }
    };

  } catch (error) {
    return {
      valid: false,
      message: `API Base URL 验证失败: ${error}`
    };
  }
}

/**
 * 测试配置连接
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test');

    if (!testType) {
      return NextResponse.json({
        success: false,
        error: '缺少测试类型参数'
      }, { status: 400 });
    }

    let testResult;

    switch (testType) {
      case 'notion':
        testResult = await testNotionConnection();
        break;
      case 'midscene':
        testResult = await testMidsceneConnection();
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的测试类型'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: testResult
    });

  } catch (error) {
    console.error('❌ 连接测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '连接测试失败'
    }, { status: 500 });
  }
}

/**
 * 测试 Notion 连接
 */
async function testNotionConnection() {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return {
      connected: false,
      message: 'Notion 配置不完整',
      details: {
        hasApiKey: !!apiKey,
        hasDatabaseId: !!databaseId
      }
    };
  }

  try {
    // 测试 API Key
    const userResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!userResponse.ok) {
      return {
        connected: false,
        message: 'Notion API Key 无效'
      };
    }

    // 测试数据库访问
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!dbResponse.ok) {
      return {
        connected: false,
        message: '数据库访问失败，请检查数据库 ID 和权限'
      };
    }

    const dbData = await dbResponse.json();

    return {
      connected: true,
      message: 'Notion 连接成功',
      details: {
        database: dbData.title?.[0]?.plain_text || '未命名数据库',
        properties: Object.keys(dbData.properties || {}).length
      }
    };

  } catch (error) {
    return {
      connected: false,
      message: `Notion 连接失败: ${error}`
    };
  }
}

/**
 * 测试 Midscene 连接
 */
async function testMidsceneConnection() {
  const apiKey = process.env.MIDSCENE_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      message: 'Midscene API Key 未配置'
    };
  }

  // 模拟连接测试
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    connected: true,
    message: 'Midscene 连接成功（模拟模式）',
    details: {
      mode: 'simulation',
      apiKey: apiKey.substring(0, 10) + '...',
      note: '当前使用模拟模式'
    }
  };
}
