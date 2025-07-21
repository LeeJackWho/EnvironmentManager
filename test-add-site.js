/**
 * 测试添加网站功能
 * 用于验证 Notion API 连接和数据库操作
 */

const axios = require('axios');

const testSite = {
  name: '测试网站 - ' + new Date().toLocaleString(),
  url: 'https://test-site.example.com',
  username: 'test_user',
  password: 'test_password',
  environment: '测试环境',
  captchaType: '无',
  notes: '这是一个测试网站，用于验证系统功能'
};

async function testAddSite() {
  try {
    console.log('🧪 开始测试添加网站功能...');
    console.log('📋 测试数据:', testSite);

    const response = await axios.post('http://localhost:3000/api/sites/add', testSite, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ 添加网站成功!');
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应数据:', response.data);

    if (response.data.success) {
      console.log('🎉 网站添加成功，ID:', response.data.data.id);
      console.log('📝 网站名称:', response.data.data.name);
      console.log('🌐 网站URL:', response.data.data.url);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📋 错误数据:', error.response.data);
    } else if (error.request) {
      console.error('🌐 网络错误: 无法连接到服务器');
      console.error('💡 请确保应用正在运行: npm run dev');
    }
  }
}

// 运行测试
testAddSite();
