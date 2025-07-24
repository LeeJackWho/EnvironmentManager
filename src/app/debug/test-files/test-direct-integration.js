#!/usr/bin/env node

/**
 * Midscene 直接集成测试脚本
 * 验证直接集成功能是否正常工作
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

// 检查直接集成配置
function checkDirectIntegrationConfig() {
  log('\n⚡ 检查 Midscene 直接集成配置...', 'cyan');
  
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    modelName: process.env.MIDSCENE_MODEL_NAME || 'gpt-4-vision-preview'
  };

  const results = [];
  let provider = 'none';

  // 检查统一的 AI 配置
  if (config.apiKey) {
    if (!config.apiKey.startsWith('sk-')) {
      results.push({ status: 'warning', message: 'API Key 格式可能不正确（应以 sk- 开头）' });
    } else {
      results.push({ status: 'success', message: `API Key: ${config.apiKey.substring(0, 15)}...` });

      // 检测提供商类型
      if (config.apiKey.startsWith('sk-or-')) {
        provider = 'openrouter';
        results.push({ status: 'info', message: '检测到 OpenRouter API Key' });

        if (config.baseUrl && config.baseUrl.includes('openrouter.ai')) {
          results.push({ status: 'success', message: `Base URL: ${config.baseUrl}` });
        } else if (config.baseUrl) {
          results.push({ status: 'warning', message: 'OpenRouter 建议使用 https://openrouter.ai/api/v1' });
        }
      } else {
        provider = 'openai';
        results.push({ status: 'info', message: '检测到 OpenAI API Key' });

        if (config.baseUrl) {
          results.push({ status: 'info', message: `自定义 Base URL: ${config.baseUrl}` });
          provider = 'custom';
        } else {
          results.push({ status: 'info', message: '使用 OpenAI 官方 API' });
        }
      }
    }

    // 检查模型配置
    results.push({ status: 'success', message: `Model: ${config.modelName}` });

    // 分析模型特性
    if (config.modelName.includes(':free')) {
      results.push({ status: 'info', message: '使用免费模型' });
    }

    if (config.modelName.includes('qwen')) {
      results.push({ status: 'info', message: '使用 Qwen 模型（中文优化）' });
    } else if (config.modelName.includes('gpt-4')) {
      results.push({ status: 'info', message: '使用 GPT-4 Vision（高精度）' });
    } else if (config.modelName.includes('claude')) {
      results.push({ status: 'info', message: '使用 Claude Vision' });
    } else if (config.modelName.includes('gemini')) {
      results.push({ status: 'info', message: '使用 Gemini Vision' });
    }
  } else {
    results.push({ status: 'error', message: '未配置 OPENAI_API_KEY' });
  }
  
  return { provider, results };
}

// 检查项目文件
function checkProjectFiles() {
  log('\n📁 检查项目文件...', 'cyan');
  
  const requiredFiles = [
    'src/lib/midscene-direct.ts',
    'src/lib/env.ts',
    'src/app/api/enhanced-auto-login/route.ts',
    'test-midscene-direct.html'
  ];
  
  const results = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.push({ status: 'success', message: `✅ ${file}` });
    } else {
      results.push({ status: 'error', message: `❌ 缺少文件: ${file}` });
    }
  });
  
  return results;
}

// 显示结果
function displayResults(results) {
  results.forEach(result => {
    switch (result.status) {
      case 'success':
        log(result.message, 'green');
        break;
      case 'warning':
        log(`⚠️ ${result.message}`, 'yellow');
        break;
      case 'error':
        log(`❌ ${result.message}`, 'red');
        break;
      case 'info':
        log(`ℹ️ ${result.message}`, 'blue');
        break;
    }
  });
}

// 生成使用指南
function generateUsageGuide(provider) {
  log('\n📚 使用指南:', 'cyan');

  if (provider === 'openrouter') {
    log('🎯 当前配置: OpenRouter 服务', 'green');
    log('✨ 优势:', 'cyan');
    log('   • 支持多种免费模型', 'blue');
    log('   • 中文验证码识别优化（Qwen 模型）', 'blue');
    log('   • 无需额外付费', 'blue');

  } else if (provider === 'openai') {
    log('🎯 当前配置: OpenAI 官方服务', 'green');
    log('✨ 优势:', 'cyan');
    log('   • 最高识别精度', 'blue');
    log('   • 稳定性好', 'blue');
    log('   • 官方推荐', 'blue');

  } else if (provider === 'custom') {
    log('🎯 当前配置: 自定义 API 服务', 'green');
    log('✨ 优势:', 'cyan');
    log('   • 灵活配置', 'blue');
    log('   • 支持任何兼容服务', 'blue');
    log('   • 可控性强', 'blue');

  } else {
    log('⚠️ 未配置 AI 模型，将使用模拟模式', 'yellow');
    log('💡 配置建议:', 'cyan');
    log('   1. 免费方案: OpenRouter + Qwen2.5-VL', 'blue');
    log('   2. 付费方案: OpenAI GPT-4 Vision', 'blue');
    log('   3. 自定义方案: 其他兼容服务', 'blue');
  }
  
  log('\n🚀 测试步骤:', 'cyan');
  log('1. 启动开发服务器:', 'blue');
  log('   npm run dev', 'blue');
  log('2. 访问测试页面:', 'blue');
  log('   http://localhost:3000/test-midscene-direct.html', 'blue');
  log('3. 进行功能测试:', 'blue');
  log('   - 启用 Midscene 直接集成模式', 'blue');
  log('   - 选择验证码类型', 'blue');
  log('   - 观察日志输出', 'blue');
  
  log('\n🔍 预期结果:', 'cyan');
  if (provider !== 'none') {
    log('   ✅ 显示 "Midscene 直接客户端初始化成功"', 'blue');
    log(`   ✅ 使用 ${provider.toUpperCase()} API 进行分析`, 'blue');
    log('   ✅ 生成智能验证码处理建议', 'blue');
    log('   ✅ 支持多种模型和服务商', 'blue');
  } else {
    log('   ⚠️ 显示 "使用模拟模式"', 'blue');
    log('   ⚠️ 提供基础的验证码检测', 'blue');
    log('   💡 建议配置 AI API Key 获得更好效果', 'blue');
  }
  log('   ✅ 记录完整的调试信息', 'blue');
}

// 主函数
function main() {
  log('⚡ Midscene 直接集成测试工具', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  // 加载环境变量
  loadEnv();
  
  // 检查配置
  const { provider, results: configResults } = checkDirectIntegrationConfig();
  displayResults(configResults);
  
  // 检查文件
  const fileResults = checkProjectFiles();
  displayResults(fileResults);
  
  // 统计问题
  const allResults = [...configResults, ...fileResults];
  const errorCount = allResults.filter(r => r.status === 'error').length;
  const warningCount = allResults.filter(r => r.status === 'warning').length;
  
  // 生成指南
  generateUsageGuide(provider);
  
  // 显示总结
  log('\n' + '=' .repeat(50), 'magenta');
  
  if (errorCount === 0) {
    log('🎉 直接集成配置检查通过！', 'green');
    if (warningCount > 0) {
      log(`⚠️ 有 ${warningCount} 个警告，但不影响使用`, 'yellow');
    }
  } else {
    log(`❌ 发现 ${errorCount} 个错误，需要修复`, 'red');
  }
  
  log(`📊 配置提供商: ${provider.toUpperCase()}`, provider === 'none' ? 'yellow' : 'green');
  
  process.exit(errorCount === 0 ? 0 : 1);
}

// 运行测试
main();
