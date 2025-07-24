#!/usr/bin/env node

/**
 * API 请求测试脚本
 * 直接测试 enhanced-auto-login API 端点
 */

const { default: fetch } = require('node-fetch');

async function testAPI() {
  console.log('🧪 测试 enhanced-auto-login API...');
  
  const testData = {
    name: 'API测试网站',
    url: 'https://example.com/login',
    username: 'test_user',
    password: 'test_pass',
    captchaType: '图形',
    useMidscene: true,  // 明确启用智能模式
    notes: 'API 直接测试'
  };
  
  console.log('📤 发送请求数据:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/enhanced-auto-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 响应状态:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📊 响应结果:', JSON.stringify(result, null, 2));
    
    // 分析结果
    if (result.success) {
      console.log('✅ API 调用成功');
    } else {
      console.log('❌ API 调用失败:', result.error);
    }
    
    // 检查是否使用了智能模式
    const resultStr = JSON.stringify(result);
    if (resultStr.includes('Midscene') || resultStr.includes('智能')) {
      console.log('🤖 检测到智能模式相关信息');
    } else {
      console.log('⚠️ 未检测到智能模式信息');
    }
    
    if (resultStr.includes('传统')) {
      console.log('🔧 检测到传统模式信息');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.log('💡 请确保服务器正在运行: npm run dev');
  }
}

// 运行测试
testAPI();
