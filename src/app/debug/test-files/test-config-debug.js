#!/usr/bin/env node

/**
 * 配置调试测试脚本
 * 验证环境变量和配置是否正确读取
 */

// 模拟 Next.js 环境
process.env.NODE_ENV = 'development';

// 手动加载 .env.local
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
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
    
    console.log('✅ 已加载 .env.local 文件');
  } else {
    console.log('⚠️ 未找到 .env.local 文件');
  }
}

// 加载环境变量
loadEnvFile();

// 测试配置读取
console.log('🔍 环境变量测试:');
console.log('================');

console.log('📋 原始环境变量:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` : '(未设置)');
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '(未设置)');
console.log('MIDSCENE_MODEL_NAME:', process.env.MIDSCENE_MODEL_NAME || '(未设置)');

// 测试 getMidsceneConfig 函数
console.log('\n🔧 配置函数测试:');
console.log('================');

try {
  // 动态导入配置模块
  const envModule = require('./src/lib/env.ts');
  
  if (envModule.getMidsceneConfig) {
    const config = envModule.getMidsceneConfig();
    console.log('📊 getMidsceneConfig 结果:', JSON.stringify(config, null, 2));
  } else {
    console.log('⚠️ getMidsceneConfig 函数未找到');
  }
  
  if (envModule.checkMidsceneConfig) {
    const check = envModule.checkMidsceneConfig();
    console.log('✅ checkMidsceneConfig 结果:', JSON.stringify(check, null, 2));
  } else {
    console.log('⚠️ checkMidsceneConfig 函数未找到');
  }
  
} catch (error) {
  console.log('❌ 配置模块加载失败:', error.message);
  
  // 手动测试配置逻辑
  console.log('\n🔧 手动配置测试:');
  console.log('================');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const model = process.env.MIDSCENE_MODEL_NAME || 'gpt-4-vision-preview';
  
  if (!apiKey) {
    console.log('❌ 配置问题: OPENAI_API_KEY 未设置');
    console.log('💡 请在 .env.local 中设置 OPENAI_API_KEY');
  } else {
    console.log('✅ API Key 已配置');
    
    let provider = 'openai';
    if (apiKey.startsWith('sk-or-')) {
      provider = 'openrouter';
    } else if (baseUrl && !baseUrl.includes('api.openai.com')) {
      provider = 'custom';
    }
    
    console.log('📊 手动解析的配置:');
    console.log({
      provider,
      apiKey: apiKey.substring(0, 15) + '...',
      baseUrl: baseUrl || '(使用默认)',
      model
    });
  }
}

// 测试 MidsceneDirectClient
console.log('\n🤖 MidsceneDirectClient 测试:');
console.log('================');

try {
  const midsceneModule = require('./src/lib/midscene-direct.ts');
  
  if (midsceneModule.createMidsceneDirectClient) {
    const client = midsceneModule.createMidsceneDirectClient();
    console.log('✅ MidsceneDirectClient 创建成功');
    
    // 测试初始化
    client.initialize().then(result => {
      console.log('🚀 初始化结果:', result);
    }).catch(error => {
      console.log('❌ 初始化失败:', error.message);
    });
    
  } else {
    console.log('⚠️ createMidsceneDirectClient 函数未找到');
  }
  
} catch (error) {
  console.log('❌ MidsceneDirectClient 模块加载失败:', error.message);
}

// 模拟 API 请求测试
console.log('\n📡 模拟 API 请求测试:');
console.log('================');

const testData = {
  name: '配置测试',
  url: 'https://example.com',
  username: 'test',
  password: 'test',
  captchaType: '图形',
  useMidscene: true,
  notes: '配置调试测试'
};

console.log('📤 测试请求数据:', JSON.stringify(testData, null, 2));

// 检查请求是否会正确解析
const { useMidscene } = testData;
console.log('🔍 useMidscene 参数:', useMidscene, typeof useMidscene);

if (useMidscene) {
  console.log('✅ 应该使用智能模式');
} else {
  console.log('⚠️ 应该使用传统模式');
}

console.log('\n🎯 测试完成');
console.log('================');
console.log('如果看到配置问题，请检查 .env.local 文件');
console.log('如果配置正确但智能模式不工作，请检查服务器日志');
