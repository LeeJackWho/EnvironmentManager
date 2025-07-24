#!/usr/bin/env node

/**
 * Midscene.js 模型配置检查工具
 * 根据官方文档验证不同模型的配置
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
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=');
        }
      }
    });
  }
  
  return env;
}

// 检测配置的模型
function detectConfiguredModels(env) {
  const models = [];
  
  if (env.OPENAI_API_KEY) {
    models.push({
      name: 'OpenAI GPT-4 Vision',
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      status: env.OPENAI_API_KEY.startsWith('sk-') ? 'valid' : 'warning',
      message: env.OPENAI_API_KEY.startsWith('sk-') ? '格式正确' : 'API Key 格式可能不正确'
    });
  }
  
  if (env.GOOGLE_API_KEY) {
    models.push({
      name: 'Google Gemini Vision',
      provider: 'google',
      apiKey: env.GOOGLE_API_KEY,
      status: env.GOOGLE_API_KEY.startsWith('AIza') ? 'valid' : 'warning',
      message: env.GOOGLE_API_KEY.startsWith('AIza') ? '格式正确' : 'API Key 格式可能不正确'
    });
  }
  
  if (env.AZURE_OPENAI_API_KEY) {
    const hasEndpoint = !!env.AZURE_OPENAI_ENDPOINT;
    models.push({
      name: 'Azure OpenAI',
      provider: 'azure',
      apiKey: env.AZURE_OPENAI_API_KEY,
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      status: hasEndpoint ? 'valid' : 'error',
      message: hasEndpoint ? '配置完整' : '缺少 AZURE_OPENAI_ENDPOINT'
    });
  }
  
  if (env.ANTHROPIC_API_KEY) {
    models.push({
      name: 'Anthropic Claude',
      provider: 'anthropic',
      apiKey: env.ANTHROPIC_API_KEY,
      status: env.ANTHROPIC_API_KEY.startsWith('sk-ant-') ? 'valid' : 'warning',
      message: env.ANTHROPIC_API_KEY.startsWith('sk-ant-') ? '格式正确' : 'API Key 格式可能不正确'
    });
  }
  
  if (env.OLLAMA_BASE_URL) {
    let status = 'valid';
    let message = '配置正确';
    
    try {
      new URL(env.OLLAMA_BASE_URL);
    } catch {
      status = 'error';
      message = 'URL 格式不正确';
    }
    
    models.push({
      name: 'Ollama (本地模型)',
      provider: 'ollama',
      endpoint: env.OLLAMA_BASE_URL,
      status,
      message
    });
  }
  
  return models;
}

// 显示模型配置状态
function displayModelStatus(models) {
  log('\n🤖 检测到的模型配置:', 'cyan');
  
  if (models.length === 0) {
    log('❌ 未检测到任何模型配置', 'red');
    return false;
  }
  
  let hasValidModel = false;
  
  models.forEach((model, index) => {
    const statusIcon = {
      'valid': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[model.status];
    
    const statusColor = {
      'valid': 'green',
      'warning': 'yellow',
      'error': 'red'
    }[model.status];
    
    log(`\n${index + 1}. ${model.name}`, 'blue');
    log(`   ${statusIcon} 状态: ${model.message}`, statusColor);
    
    if (model.apiKey) {
      log(`   🔑 API Key: ${model.apiKey.substring(0, 10)}...`, 'blue');
    }
    
    if (model.endpoint) {
      log(`   🌐 Endpoint: ${model.endpoint}`, 'blue');
    }
    
    if (model.status === 'valid') {
      hasValidModel = true;
    }
  });
  
  return hasValidModel;
}

// 生成配置建议
function generateRecommendations(models, env) {
  log('\n💡 配置建议:', 'cyan');
  
  if (models.length === 0) {
    log('📝 请配置至少一个 AI 模型:', 'yellow');
    log('   1. OpenAI (推荐): OPENAI_API_KEY=sk-your-key', 'blue');
    log('   2. Google Gemini: GOOGLE_API_KEY=AIza-your-key', 'blue');
    log('   3. 本地 Ollama: OLLAMA_BASE_URL=http://localhost:11434', 'blue');
    return;
  }
  
  const validModels = models.filter(m => m.status === 'valid');
  const warningModels = models.filter(m => m.status === 'warning');
  const errorModels = models.filter(m => m.status === 'error');
  
  if (validModels.length > 0) {
    log(`✅ 发现 ${validModels.length} 个有效配置`, 'green');
    log('   Midscene.js 会自动选择最佳模型', 'blue');
  }
  
  if (warningModels.length > 0) {
    log(`⚠️ ${warningModels.length} 个配置有警告，建议检查`, 'yellow');
  }
  
  if (errorModels.length > 0) {
    log(`❌ ${errorModels.length} 个配置有错误，需要修复`, 'red');
  }
  
  // 特定建议
  if (models.some(m => m.provider === 'google' && m.status === 'valid')) {
    log('\n🎯 当前推荐使用 Google Gemini (已配置)', 'green');
  } else if (models.some(m => m.provider === 'openai' && m.status === 'valid')) {
    log('\n🎯 当前推荐使用 OpenAI GPT-4 Vision (已配置)', 'green');
  } else {
    log('\n🎯 建议配置 Google Gemini 或 OpenAI GPT-4 Vision', 'yellow');
  }
}

// 显示配置指南
function showConfigGuide() {
  log('\n📚 配置指南:', 'cyan');
  log('   📖 详细文档: midscene-model-config.md', 'blue');
  log('   🌐 官方文档: https://midscenejs.com/choose-a-model.html', 'blue');
  log('   🔧 配置文件: .env.local', 'blue');
  
  log('\n🚀 测试步骤:', 'cyan');
  log('   1. npm run dev', 'blue');
  log('   2. 访问 http://localhost:3000/test-enhanced-captcha.html', 'blue');
  log('   3. 启用 Midscene 智能模式', 'blue');
  log('   4. 观察控制台日志', 'blue');
}

// 主函数
function main() {
  log('🔍 Midscene.js 模型配置检查工具', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  // 加载环境变量
  const env = loadEnv();
  
  // 检测配置的模型
  const models = detectConfiguredModels(env);
  
  // 显示状态
  const hasValidModel = displayModelStatus(models);
  
  // 生成建议
  generateRecommendations(models, env);
  
  // 显示指南
  showConfigGuide();
  
  // 总结
  log('\n' + '=' .repeat(50), 'magenta');
  if (hasValidModel) {
    log('🎉 模型配置检查通过！', 'green');
  } else {
    log('⚠️ 需要配置有效的 AI 模型', 'yellow');
  }
  
  process.exit(hasValidModel ? 0 : 1);
}

// 运行检查
main();
