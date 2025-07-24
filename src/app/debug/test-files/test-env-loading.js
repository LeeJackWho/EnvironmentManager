/**
 * 测试 .env.local 环境变量加载
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 测试 .env.local 环境变量加载');
console.log('=' .repeat(50));

// 1. 检查 .env.local 文件是否存在
const envPath = path.join(process.cwd(), '.env.local');
console.log('📁 .env.local 文件路径:', envPath);
console.log('📄 文件是否存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  // 2. 读取文件内容
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📝 .env.local 文件内容:');
  console.log(envContent);

  // 3. 解析环境变量
  const envLines = envContent.split('\n');
  const parsedVars = {};

  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        parsedVars[key.trim()] = value;
      }
    }
  });

  console.log('\n🔧 解析的环境变量:');
  Object.keys(parsedVars).forEach(key => {
    if (key.includes('API_KEY')) {
      console.log(`  ${key}: ${parsedVars[key] ? parsedVars[key].substring(0, 10) + '...' : '(空)'}`);
    } else {
      console.log(`  ${key}: ${parsedVars[key] || '(空)'}`);
    }
  });
}

// 4. 检查 process.env 中的值
console.log('\n🌐 process.env 中的 Midscene 相关变量:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : '(未设置)');
console.log('  OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '(未设置)');
console.log('  MIDSCENE_MODEL_NAME:', process.env.MIDSCENE_MODEL_NAME || '(未设置)');

// 5. 测试导入 env.ts 模块
console.log('\n📦 测试导入 env.ts 模块...');
try {
  // 注意：在 Node.js 环境中，需要使用 require 而不是 import
  const envModule = require('../../lib/env.ts');
  
  if (envModule.getMidsceneConfig) {
    const config = envModule.getMidsceneConfig();
    console.log('✅ getMidsceneConfig() 结果:');
    console.log('  provider:', config.provider);
    console.log('  apiKey:', config.apiKey ? config.apiKey.substring(0, 10) + '...' : '(未设置)');
    console.log('  baseUrl:', config.baseUrl || '(未设置)');
    console.log('  model:', config.model || '(未设置)');
  } else {
    console.log('❌ getMidsceneConfig 函数不存在');
  }
} catch (error) {
  console.log('❌ 导入 env.ts 失败:', error.message);
  
  // 尝试直接加载环境变量
  console.log('\n🔄 尝试手动加载 .env.local...');
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

    console.log('✅ 手动加载完成');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : '(未设置)');
    console.log('  OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '(未设置)');
    console.log('  MIDSCENE_MODEL_NAME:', process.env.MIDSCENE_MODEL_NAME || '(未设置)');
  }
}

console.log('\n' + '=' .repeat(50));
console.log('✅ 环境变量测试完成');
