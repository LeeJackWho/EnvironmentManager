#!/usr/bin/env node

/**
 * OpenRouter 配置测试脚本
 * 验证 OpenRouter + Qwen2.5-VL 配置是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 加载环境变量
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  }
}

// 检查 OpenRouter 配置
function checkOpenRouterConfig() {
  log('\n🔍 检查 OpenRouter 配置...', 'cyan');
  
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    modelName: process.env.MIDSCENE_MODEL_NAME
  };
  
  const issues = [];
  const info = [];
  
  // 检查 API Key
  if (!config.apiKey) {
    issues.push('❌ OPENAI_API_KEY 未配置');
  } else if (!config.apiKey.startsWith('sk-or-')) {
    issues.push('⚠️ API Key 格式可能不正确（OpenRouter 密钥应以 sk-or- 开头）');
  } else {
    log(`✅ API Key: ${config.apiKey.substring(0, 15)}...`, 'green');
    info.push('API Key 格式正确');
  }
  
  // 检查 Base URL
  if (!config.baseUrl) {
    issues.push('❌ OPENAI_BASE_URL 未配置');
  } else if (!config.baseUrl.includes('openrouter.ai')) {
    issues.push('⚠️ Base URL 不是 OpenRouter 服务');
  } else {
    log(`✅ Base URL: ${config.baseUrl}`, 'green');
    info.push('使用 OpenRouter 服务');
  }
  
  // 检查模型名称
  if (!config.modelName) {
    issues.push('⚠️ MIDSCENE_MODEL_NAME 未配置，将使用默认模型');
  } else {
    log(`✅ Model: ${config.modelName}`, 'green');
    
    // 检查是否是免费模型
    if (config.modelName.includes(':free')) {
      info.push('使用免费模型');
    }
    
    // 检查是否是 Qwen 模型
    if (config.modelName.includes('qwen')) {
      info.push('使用 Qwen 视觉模型（支持中文）');
    }
  }
  
  return { config, issues, info };
}

// 测试 OpenRouter API 连接
async function testOpenRouterAPI() {
  log('\n🧪 测试 OpenRouter API 连接...', 'cyan');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const modelName = process.env.MIDSCENE_MODEL_NAME || 'qwen/qwen2.5-vl-72b-instruct:free';
  
  if (!apiKey || !baseUrl) {
    log('❌ 配置不完整，跳过 API 测试', 'red');
    return false;
  }
  
  try {
    // 创建简单的测试图片（1x1 像素的 PNG）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '这是一个测试图片，请简单描述一下你看到了什么。'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://environment-manager.local',
      'X-Title': 'Environment Manager - API Test'
    };
    
    log('📤 发送测试请求...', 'yellow');
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    log(`📥 收到响应: ${response.status} ${response.statusText}`, 'blue');
    
    const responseText = await response.text();

    if (!response.ok) {
      log(`❌ API 请求失败: ${responseText}`, 'red');
      return false;
    }

    // 检查响应是否是 JSON
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      log(`❌ 收到 HTML 响应而不是 JSON，可能是认证或 URL 问题`, 'red');
      log(`📄 响应内容前100字符: ${responseText.substring(0, 100)}...`, 'yellow');
      return false;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      log(`❌ JSON 解析失败: ${parseError.message}`, 'red');
      log(`📄 响应内容: ${responseText.substring(0, 200)}...`, 'yellow');
      return false;
    }
    log('✅ API 测试成功!', 'green');
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      log(`🤖 模型响应: ${result.choices[0].message.content}`, 'blue');
    }
    
    // 显示使用统计
    if (result.usage) {
      log(`📊 Token 使用: ${JSON.stringify(result.usage)}`, 'blue');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ API 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 生成配置建议
function generateRecommendations(issues, info, apiTestPassed) {
  log('\n💡 配置建议:', 'cyan');
  
  if (issues.length === 0 && apiTestPassed) {
    log('🎉 OpenRouter 配置完美！', 'green');
    log('✨ 优势:', 'cyan');
    info.forEach(item => log(`   • ${item}`, 'blue'));
    
    log('\n🚀 下一步:', 'cyan');
    log('   1. npm run dev', 'blue');
    log('   2. 访问 http://localhost:3000/test-enhanced-captcha.html', 'blue');
    log('   3. 启用 Midscene 智能模式', 'blue');
    log('   4. 应该看到 "OpenRouter" 提供商', 'blue');
    
  } else {
    if (issues.length > 0) {
      log('🔧 需要修复的问题:', 'yellow');
      issues.forEach(issue => log(`   ${issue}`, 'red'));
    }
    
    if (!apiTestPassed) {
      log('\n🛠️ API 测试失败的可能原因:', 'yellow');
      log('   • API Key 无效或已过期', 'blue');
      log('   • 网络连接问题', 'blue');
      log('   • OpenRouter 服务暂时不可用', 'blue');
      log('   • 模型不支持视觉功能', 'blue');
    }
    
    log('\n📚 参考资源:', 'cyan');
    log('   • OpenRouter 官网: https://openrouter.ai/', 'blue');
    log('   • API 文档: https://openrouter.ai/docs', 'blue');
    log('   • 模型列表: https://openrouter.ai/models', 'blue');
  }
}

// 主函数
async function main() {
  log('🔍 OpenRouter + Qwen2.5-VL 配置测试', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  // 加载环境变量
  loadEnv();
  
  // 检查配置
  const { config, issues, info } = checkOpenRouterConfig();
  
  // 测试 API
  const apiTestPassed = await testOpenRouterAPI();
  
  // 生成建议
  generateRecommendations(issues, info, apiTestPassed);
  
  // 显示配置摘要
  log('\n📋 配置摘要:', 'cyan');
  log(`   提供商: OpenRouter`, 'blue');
  log(`   模型: ${config.modelName || '默认'}`, 'blue');
  log(`   API 测试: ${apiTestPassed ? '✅ 通过' : '❌ 失败'}`, apiTestPassed ? 'green' : 'red');
  
  log('\n' + '=' .repeat(50), 'magenta');
  if (issues.length === 0 && apiTestPassed) {
    log('🎉 OpenRouter 配置测试通过！', 'green');
  } else {
    log('⚠️ 配置需要调整', 'yellow');
  }
  
  process.exit(issues.length === 0 && apiTestPassed ? 0 : 1);
}

// 运行测试
main().catch(error => {
  log(`❌ 测试过程出错: ${error.message}`, 'red');
  process.exit(1);
});
