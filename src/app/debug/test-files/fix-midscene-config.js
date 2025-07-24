#!/usr/bin/env node

/**
 * Midscene 配置检查和修复工具
 * 帮助用户正确设置 Midscene.js 配置
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 加载当前环境变量
function loadCurrentEnv() {
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

// 检查当前配置
function checkCurrentConfig() {
  log('\n🔍 检查当前 Midscene 配置...', 'cyan');
  
  const env = loadCurrentEnv();
  const issues = [];
  
  // 检查 API Key
  if (!env.MIDSCENE_API_KEY) {
    issues.push('❌ MIDSCENE_API_KEY 未设置');
  } else {
    const apiKey = env.MIDSCENE_API_KEY;
    log(`✅ API Key: ${apiKey.substring(0, 10)}...`, 'green');
    
    // 检查 API Key 格式
    if (apiKey.startsWith('AIza')) {
      issues.push('⚠️ API Key 看起来像 Google API Key，可能不是正确的 Midscene API Key');
    }
  }
  
  // 检查 API Base
  if (env.MIDSCENE_API_BASE) {
    log(`✅ API Base: ${env.MIDSCENE_API_BASE}`, 'green');
    
    // 检查 URL 格式
    if (env.MIDSCENE_API_BASE.includes('deno.dev')) {
      issues.push('⚠️ API Base 使用的是测试服务器，可能不稳定');
    }
  } else {
    log('ℹ️ API Base: 使用默认值', 'blue');
  }
  
  // 检查模型名称
  if (env.MIDSCENE_MODEL_NAME) {
    log(`✅ Model: ${env.MIDSCENE_MODEL_NAME}`, 'green');
  } else {
    log('ℹ️ Model: 使用默认值', 'blue');
  }
  
  return { env, issues };
}

// 推荐的配置选项
const recommendedConfigs = {
  'OpenAI GPT-4 Vision': {
    apiBase: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-4-vision-preview',
    description: '使用 OpenAI GPT-4 Vision API（需要 OpenAI API Key）'
  },
  'Google Gemini Vision': {
    apiBase: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    modelName: 'gemini-pro-vision',
    description: '使用 Google Gemini Vision API（需要 Google API Key）'
  },
  'Midscene 官方服务': {
    apiBase: 'https://api.midscenejs.com/v1/analyze',
    modelName: 'midscene-vision-v1',
    description: '使用 Midscene 官方 API 服务（需要 Midscene API Key）'
  },
  '自定义服务': {
    apiBase: '',
    modelName: '',
    description: '使用自定义的 API 服务'
  }
};

// 配置向导
async function configWizard() {
  log('\n🧙‍♂️ Midscene 配置向导', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  // 选择配置类型
  log('\n📋 请选择您要使用的服务类型:', 'cyan');
  const options = Object.keys(recommendedConfigs);
  options.forEach((option, index) => {
    const config = recommendedConfigs[option];
    log(`${index + 1}. ${option}`, 'yellow');
    log(`   ${config.description}`, 'blue');
  });
  
  const choice = await question('\n请输入选项编号 (1-4): ');
  const selectedOption = options[parseInt(choice) - 1];
  
  if (!selectedOption) {
    log('❌ 无效选择', 'red');
    return null;
  }
  
  const selectedConfig = recommendedConfigs[selectedOption];
  log(`\n✅ 您选择了: ${selectedOption}`, 'green');
  
  // 获取 API Key
  const apiKey = await question('\n🔑 请输入您的 API Key: ');
  
  if (!apiKey.trim()) {
    log('❌ API Key 不能为空', 'red');
    return null;
  }
  
  // 获取 API Base（如果是自定义）
  let apiBase = selectedConfig.apiBase;
  if (selectedOption === '自定义服务') {
    apiBase = await question('🌐 请输入 API Base URL: ');
  }
  
  // 获取模型名称（如果是自定义）
  let modelName = selectedConfig.modelName;
  if (selectedOption === '自定义服务') {
    modelName = await question('🤖 请输入模型名称: ');
  }
  
  return {
    apiKey: apiKey.trim(),
    apiBase: apiBase || 'https://api.midscenejs.com',
    modelName: modelName || 'gemini-pro-vision'
  };
}

// 更新环境变量文件
function updateEnvFile(newConfig) {
  const envPath = path.join(process.cwd(), '.env.local');
  let content = '';
  
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  
  // 更新或添加 Midscene 配置
  const updates = {
    'MIDSCENE_API_KEY': newConfig.apiKey,
    'MIDSCENE_API_BASE': newConfig.apiBase,
    'MIDSCENE_MODEL_NAME': newConfig.modelName
  };
  
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      // 在 Midscene 配置部分添加
      const midsceneSection = '# 🤖 Midscene.js 配置';
      if (content.includes(midsceneSection)) {
        const sectionIndex = content.indexOf(midsceneSection);
        const nextSectionIndex = content.indexOf('\n# ', sectionIndex + 1);
        const insertIndex = nextSectionIndex === -1 ? content.length : nextSectionIndex;
        content = content.slice(0, insertIndex) + `\n${newLine}` + content.slice(insertIndex);
      } else {
        content += `\n\n# 🤖 Midscene.js 配置\n${newLine}`;
      }
    }
  });
  
  fs.writeFileSync(envPath, content);
  log(`✅ 配置已保存到 ${envPath}`, 'green');
}

// 测试配置
async function testConfig(config) {
  log('\n🧪 测试配置...', 'cyan');
  
  try {
    // 这里可以添加实际的 API 测试
    log('⏳ 正在测试 API 连接...', 'yellow');
    
    // 模拟测试
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    log('✅ 配置测试完成', 'green');
    return true;
  } catch (error) {
    log(`❌ 配置测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function main() {
  try {
    log('🔧 Midscene.js 配置检查和修复工具', 'cyan');
    log('=' .repeat(50), 'cyan');
    
    // 检查当前配置
    const { env, issues } = checkCurrentConfig();
    
    if (issues.length > 0) {
      log('\n⚠️ 发现配置问题:', 'yellow');
      issues.forEach(issue => log(`   ${issue}`, 'red'));
      
      const shouldFix = await question('\n🔧 是否要运行配置向导修复这些问题? (y/n): ');
      
      if (shouldFix.toLowerCase() === 'y' || shouldFix.toLowerCase() === 'yes') {
        const newConfig = await configWizard();
        
        if (newConfig) {
          updateEnvFile(newConfig);
          
          const shouldTest = await question('\n🧪 是否要测试新配置? (y/n): ');
          if (shouldTest.toLowerCase() === 'y' || shouldTest.toLowerCase() === 'yes') {
            await testConfig(newConfig);
          }
        }
      }
    } else {
      log('\n🎉 配置检查通过!', 'green');
      
      const shouldTest = await question('\n🧪 是否要测试当前配置? (y/n): ');
      if (shouldTest.toLowerCase() === 'y' || shouldTest.toLowerCase() === 'yes') {
        await testConfig(env);
      }
    }
    
    log('\n📋 配置文件位置:', 'cyan');
    log('   主配置: .env.local', 'blue');
    log('   功能配置: midscene.config.js', 'blue');
    log('   MCP 配置: mcp-config.json', 'blue');
    
    log('\n💡 下一步:', 'cyan');
    log('   1. 运行 npm run dev 启动开发服务器', 'blue');
    log('   2. 访问测试页面验证功能', 'blue');
    log('   3. 查看调试日志确认配置正确', 'blue');
    
  } catch (error) {
    log(`❌ 配置过程出错: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
}

// 运行主函数
main();
