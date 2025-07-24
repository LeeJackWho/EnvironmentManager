/**
 * API 功能测试脚本
 * 用于测试各种 API 端点的功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试数据
const testSite = {
  name: 'API测试网站 - ' + new Date().toLocaleString(),
  url: 'https://api-test.example.com',
  username: 'api_test_user',
  password: 'api_test_password',
  environment: '测试环境',
  captchaType: '无',
  notes: 'API 功能测试数据'
};

// 测试健康检查
async function testHealth() {
  console.log('\n🔍 测试健康检查 API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ 健康检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }
}

// 测试添加网站
async function testAddSite() {
  console.log('\n🌐 测试添加网站 API...');
  try {
    const response = await axios.post(`${BASE_URL}/api/sites/add`, testSite);
    console.log('✅ 添加网站成功:', response.data);
    return response.data.data?.id;
  } catch (error) {
    console.error('❌ 添加网站失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取网站列表
async function testGetSites() {
  console.log('\n📋 测试获取网站列表 API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/sites`);
    console.log('✅ 获取网站列表成功:', response.data);
    console.log(`📊 共 ${response.data.data?.length || 0} 个网站`);
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取网站列表失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取环境统计
async function testGetEnvironments() {
  console.log('\n📊 测试获取环境统计 API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/environments`);
    console.log('✅ 获取环境统计成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取环境统计失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试 Notion 连接
async function testNotionConnection() {
  console.log('\n🔗 测试 Notion 连接 API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/debug/test-notion`);
    console.log('✅ Notion 连接测试成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Notion 连接测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试数据库结构检查
async function testDatabaseCheck() {
  console.log('\n🗄️ 测试数据库结构检查 API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/debug/check-database`);
    console.log('✅ 数据库结构检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 数据库结构检查失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试配置验证
async function testConfigValidation() {
  console.log('\n⚙️ 测试配置验证 API...');
  try {
    // 测试 Notion 配置验证
    const notionResponse = await axios.get(`${BASE_URL}/api/config/validate?test=notion`);
    console.log('✅ Notion 配置验证成功:', notionResponse.data);
    
    // 测试 Midscene 配置验证（如果配置了的话）
    try {
      const midsceneResponse = await axios.get(`${BASE_URL}/api/config/validate?test=midscene`);
      console.log('✅ Midscene 配置验证成功:', midsceneResponse.data);
    } catch (midsceneError) {
      console.log('ℹ️ Midscene 配置未设置或验证失败（这是正常的）');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 配置验证失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试简单登录
async function testSimpleLogin() {
  console.log('\n🤖 测试简单登录 API...');
  try {
    const response = await axios.post(`${BASE_URL}/api/test-persistent`, {
      url: 'https://example.com',
      username: 'test',
      password: 'test'
    });
    console.log('✅ 简单登录测试成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 简单登录测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🧪 开始运行 API 功能测试...');
  console.log('=' * 50);
  
  const results = {
    health: false,
    notionConnection: false,
    databaseCheck: false,
    configValidation: false,
    addSite: false,
    getSites: false,
    getEnvironments: false,
    simpleLogin: false
  };
  
  // 基础连接测试
  results.health = await testHealth();
  
  if (!results.health) {
    console.log('\n❌ 基础连接失败，请确保应用正在运行 (npm run dev)');
    return results;
  }
  
  // Notion 相关测试
  results.notionConnection = await testNotionConnection();
  results.databaseCheck = await testDatabaseCheck();
  results.configValidation = await testConfigValidation();
  
  // 网站管理测试
  const siteId = await testAddSite();
  results.addSite = !!siteId;
  
  results.getSites = !!(await testGetSites());
  results.getEnvironments = !!(await testGetEnvironments());
  
  // 登录功能测试
  results.simpleLogin = await testSimpleLogin();
  
  // 测试结果汇总
  console.log('\n' + '=' * 50);
  console.log('📊 测试结果汇总:');
  console.log('=' * 50);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? '通过' : '失败'}`);
  });
  
  console.log(`\n📈 总体结果: ${passed}/${total} 项测试通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试都通过了！系统运行正常。');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置和日志。');
  }
  
  return results;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 测试运行出错:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealth,
  testAddSite,
  testGetSites,
  testGetEnvironments,
  testNotionConnection,
  testDatabaseCheck,
  testConfigValidation,
  testSimpleLogin
};
