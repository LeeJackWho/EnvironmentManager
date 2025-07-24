#!/usr/bin/env node

/**
 * 测试真实 Midscene API 调用
 * 验证 API 配置和连接是否正常
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
  cyan: '\x1b[36m'
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

// 创建测试截图
function createTestImage() {
  const testImagePath = path.join(process.cwd(), 'test-captcha-image.png');
  
  // 创建一个简单的测试图片 (1x1 像素的 PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG 签名
    0x00, 0x00, 0x00, 0x0D, // IHDR 长度
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // 宽度 1
    0x00, 0x00, 0x00, 0x01, // 高度 1
    0x08, 0x02, 0x00, 0x00, 0x00, // 位深度、颜色类型等
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT 长度
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // 数据
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND 长度
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

// 测试 Midscene API 调用
async function testMidsceneApi() {
  log('\n🤖 测试 Midscene API 调用...', 'cyan');
  
  const apiKey = process.env.MIDSCENE_API_KEY;
  const apiBase = process.env.MIDSCENE_API_BASE || 'https://api.midscenejs.com';
  const modelName = process.env.MIDSCENE_MODEL_NAME || 'gemini-pro-vision';
  
  if (!apiKey) {
    log('❌ MIDSCENE_API_KEY 未配置', 'red');
    return false;
  }
  
  log(`📡 API Base: ${apiBase}`, 'blue');
  log(`🤖 Model: ${modelName}`, 'blue');
  log(`🔑 API Key: ${apiKey.substring(0, 10)}...`, 'blue');
  
  try {
    // 创建测试图片
    const testImagePath = createTestImage();
    const imageBuffer = fs.readFileSync(testImagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    log('📸 测试图片已创建', 'green');
    
    // 构建请求
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这个图片，这是一个验证码测试。请返回JSON格式: {"type": "test", "confidence": 0.9, "message": "测试成功"}'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };
    
    log('📤 发送 API 请求...', 'yellow');
    
    const response = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    log(`📥 收到响应: ${response.status} ${response.statusText}`, 'blue');
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ API 请求失败: ${errorText}`, 'red');
      return false;
    }
    
    const result = await response.json();
    log('✅ API 调用成功!', 'green');
    log('📊 响应内容:', 'cyan');
    console.log(JSON.stringify(result, null, 2));
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    log('🗑️ 测试文件已清理', 'green');
    
    return true;
    
  } catch (error) {
    log(`❌ API 测试失败: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// 测试配置有效性
function testConfiguration() {
  log('\n🔧 测试配置有效性...', 'cyan');
  
  const config = {
    apiKey: process.env.MIDSCENE_API_KEY,
    apiBase: process.env.MIDSCENE_API_BASE,
    modelName: process.env.MIDSCENE_MODEL_NAME
  };
  
  const issues = [];
  
  if (!config.apiKey) {
    issues.push('MIDSCENE_API_KEY 未配置');
  } else if (config.apiKey.length < 10) {
    issues.push('MIDSCENE_API_KEY 格式可能不正确');
  } else {
    log(`✅ API Key: ${config.apiKey.substring(0, 10)}...`, 'green');
  }
  
  if (config.apiBase) {
    try {
      new URL(config.apiBase);
      log(`✅ API Base: ${config.apiBase}`, 'green');
    } catch {
      issues.push('MIDSCENE_API_BASE URL 格式不正确');
    }
  }
  
  if (config.modelName) {
    log(`✅ Model: ${config.modelName}`, 'green');
  }
  
  return issues;
}

// 主函数
async function main() {
  log('🔍 Midscene API 真实调用测试', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // 加载环境变量
  loadEnv();
  
  // 测试配置
  const configIssues = testConfiguration();
  
  if (configIssues.length > 0) {
    log('\n❌ 配置问题:', 'red');
    configIssues.forEach(issue => log(`   ${issue}`, 'red'));
    log('\n💡 请先修复配置问题再进行 API 测试', 'yellow');
    process.exit(1);
  }
  
  // 测试 API 调用
  const apiSuccess = await testMidsceneApi();
  
  log('\n' + '=' .repeat(50), 'cyan');
  
  if (apiSuccess) {
    log('🎉 Midscene API 测试成功!', 'green');
    log('\n📋 下一步:', 'cyan');
    log('1. 启动开发服务器: npm run dev', 'blue');
    log('2. 测试验证码功能: http://localhost:3000/test-captcha-debug.html', 'blue');
    log('3. 现在应该可以看到真实的 Midscene 分析结果', 'blue');
  } else {
    log('❌ Midscene API 测试失败', 'red');
    log('\n🔧 可能的解决方案:', 'yellow');
    log('1. 检查 API Key 是否有效', 'blue');
    log('2. 确认 API Base URL 是否正确', 'blue');
    log('3. 检查网络连接', 'blue');
    log('4. 查看 API 服务状态', 'blue');
  }
  
  process.exit(apiSuccess ? 0 : 1);
}

// 运行测试
main().catch(error => {
  log(`❌ 测试过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
