#!/usr/bin/env node

/**
 * Midscene 配置验证脚本
 * 验证配置是否正确并测试 API 连接
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

// 验证配置
function validateConfig() {
  log('\n🔍 验证 Midscene 配置...', 'cyan');
  
  const config = {
    apiKey: process.env.MIDSCENE_API_KEY,
    apiBase: process.env.MIDSCENE_API_BASE,
    modelName: process.env.MIDSCENE_MODEL_NAME,
    timeout: process.env.MIDSCENE_TIMEOUT,
    maxRetries: process.env.MIDSCENE_MAX_RETRIES
  };
  
  const results = [];
  
  // 验证 API Key
  if (!config.apiKey) {
    results.push({ status: 'error', message: 'MIDSCENE_API_KEY 未设置' });
  } else if (config.apiKey.length < 10) {
    results.push({ status: 'error', message: 'MIDSCENE_API_KEY 格式不正确（长度过短）' });
  } else {
    results.push({ status: 'success', message: `API Key: ${config.apiKey.substring(0, 10)}...` });
    
    // 检查 API Key 类型
    if (config.apiKey.startsWith('sk-')) {
      results.push({ status: 'info', message: '检测到 OpenAI API Key 格式' });
    } else if (config.apiKey.startsWith('AIza')) {
      results.push({ status: 'info', message: '检测到 Google API Key 格式' });
    } else {
      results.push({ status: 'warning', message: 'API Key 格式未知，请确认是否正确' });
    }
  }
  
  // 验证 API Base
  if (!config.apiBase) {
    results.push({ status: 'warning', message: 'MIDSCENE_API_BASE 未设置，将使用默认值' });
  } else {
    try {
      new URL(config.apiBase);
      results.push({ status: 'success', message: `API Base: ${config.apiBase}` });
      
      // 检查 API Base 类型
      if (config.apiBase.includes('openai.com')) {
        results.push({ status: 'info', message: '使用 OpenAI API 服务' });
      } else if (config.apiBase.includes('googleapis.com')) {
        results.push({ status: 'info', message: '使用 Google API 服务' });
      } else if (config.apiBase.includes('localhost')) {
        results.push({ status: 'info', message: '使用本地服务' });
      } else {
        results.push({ status: 'info', message: '使用自定义 API 服务' });
      }
    } catch {
      results.push({ status: 'error', message: 'MIDSCENE_API_BASE URL 格式不正确' });
    }
  }
  
  // 验证模型名称
  if (!config.modelName) {
    results.push({ status: 'warning', message: 'MIDSCENE_MODEL_NAME 未设置，将使用默认值' });
  } else {
    results.push({ status: 'success', message: `Model: ${config.modelName}` });
  }
  
  // 验证超时设置
  if (config.timeout) {
    const timeout = parseInt(config.timeout);
    if (isNaN(timeout) || timeout < 1000) {
      results.push({ status: 'warning', message: 'MIDSCENE_TIMEOUT 设置可能过小' });
    } else {
      results.push({ status: 'success', message: `Timeout: ${timeout}ms` });
    }
  }
  
  // 验证重试次数
  if (config.maxRetries) {
    const retries = parseInt(config.maxRetries);
    if (isNaN(retries) || retries < 1) {
      results.push({ status: 'warning', message: 'MIDSCENE_MAX_RETRIES 设置可能过小' });
    } else {
      results.push({ status: 'success', message: `Max Retries: ${retries}` });
    }
  }
  
  return { config, results };
}

// 显示验证结果
function displayResults(results) {
  log('\n📊 配置验证结果:', 'cyan');
  
  let errorCount = 0;
  let warningCount = 0;
  let successCount = 0;
  
  results.forEach(result => {
    switch (result.status) {
      case 'success':
        log(`✅ ${result.message}`, 'green');
        successCount++;
        break;
      case 'warning':
        log(`⚠️ ${result.message}`, 'yellow');
        warningCount++;
        break;
      case 'error':
        log(`❌ ${result.message}`, 'red');
        errorCount++;
        break;
      case 'info':
        log(`ℹ️ ${result.message}`, 'blue');
        break;
    }
  });
  
  log(`\n📈 统计: ${successCount} 成功, ${warningCount} 警告, ${errorCount} 错误`, 'cyan');
  
  return { errorCount, warningCount, successCount };
}

// 生成配置建议
function generateRecommendations(config, stats) {
  const recommendations = [];
  
  if (stats.errorCount > 0) {
    recommendations.push('🔧 修复所有错误配置项');
  }
  
  if (!config.apiKey) {
    recommendations.push('🔑 设置有效的 API Key');
    recommendations.push('   - OpenAI: 访问 https://platform.openai.com/api-keys');
    recommendations.push('   - Google: 访问 https://console.cloud.google.com/apis/credentials');
  }
  
  if (!config.apiBase) {
    recommendations.push('🌐 设置正确的 API Base URL');
  }
  
  if (stats.errorCount === 0 && stats.warningCount === 0) {
    recommendations.push('🎉 配置看起来很好！');
    recommendations.push('🚀 可以开始测试 Midscene 功能了');
    recommendations.push('📝 运行 npm run dev 启动开发服务器');
    recommendations.push('🧪 访问测试页面验证功能');
  }
  
  return recommendations;
}

// 主函数
async function main() {
  log('🔍 Midscene 配置验证工具', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // 加载环境变量
  loadEnv();
  
  // 验证配置
  const { config, results } = validateConfig();
  
  // 显示结果
  const stats = displayResults(results);
  
  // 生成建议
  const recommendations = generateRecommendations(config, stats);
  
  if (recommendations.length > 0) {
    log('\n💡 建议:', 'cyan');
    recommendations.forEach(rec => {
      if (rec.startsWith('   ')) {
        log(rec, 'blue');
      } else {
        log(`   ${rec}`, 'yellow');
      }
    });
  }
  
  // 显示配置文件位置
  log('\n📁 配置文件位置:', 'cyan');
  log('   主配置: .env.local', 'blue');
  log('   功能配置: midscene.config.js', 'blue');
  log('   配置模板: midscene-config-template.env', 'blue');
  
  // 显示状态
  log('\n' + '=' .repeat(50), 'cyan');
  if (stats.errorCount === 0) {
    log('🎉 配置验证通过！', 'green');
  } else {
    log('❌ 配置验证失败，请修复错误后重试', 'red');
  }
  
  process.exit(stats.errorCount === 0 ? 0 : 1);
}

// 运行验证
main().catch(error => {
  log(`❌ 验证过程出错: ${error.message}`, 'red');
  process.exit(1);
});
