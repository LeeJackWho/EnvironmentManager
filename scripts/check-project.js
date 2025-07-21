#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - 文件不存在: ${filePath}`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - 目录不存在: ${dirPath}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      '@notionhq/client',
      'axios',
      'next',
      'react',
      'react-dom',
      'react-icons'
    ];
    
    let allDepsPresent = true;
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log(`✅ 依赖 ${dep} 已安装`, 'green');
      } else {
        log(`❌ 缺少依赖: ${dep}`, 'red');
        allDepsPresent = false;
      }
    });
    
    return allDepsPresent;
  } catch (error) {
    log(`❌ 无法读取 package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentFile() {
  const envExample = fs.existsSync('.env.example');
  const envLocal = fs.existsSync('.env.local');
  
  if (envExample) {
    log('✅ .env.example 文件存在', 'green');
  } else {
    log('❌ .env.example 文件不存在', 'red');
  }
  
  if (envLocal) {
    log('✅ .env.local 文件存在', 'green');
    
    // 检查环境变量
    try {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const hasNotionKey = envContent.includes('NOTION_API_KEY=') && !envContent.includes('your_notion_api_key_here');
      const hasNotionDb = envContent.includes('NOTION_DATABASE_ID=') && !envContent.includes('your_database_id_here');
      
      if (hasNotionKey) {
        log('✅ NOTION_API_KEY 已配置', 'green');
      } else {
        log('⚠️  NOTION_API_KEY 未配置或使用默认值', 'yellow');
      }
      
      if (hasNotionDb) {
        log('✅ NOTION_DATABASE_ID 已配置', 'green');
      } else {
        log('⚠️  NOTION_DATABASE_ID 未配置或使用默认值', 'yellow');
      }
    } catch (error) {
      log(`❌ 无法读取 .env.local: ${error.message}`, 'red');
    }
  } else {
    log('⚠️  .env.local 文件不存在，请复制 .env.example 并配置', 'yellow');
  }
  
  return envExample;
}

function main() {
  log('🔍 开始检查项目完整性...', 'blue');
  log('', 'reset');
  
  let allChecksPass = true;
  
  // 检查核心文件
  log('📁 检查核心文件:', 'blue');
  allChecksPass &= checkFile('package.json', 'package.json');
  allChecksPass &= checkFile('next.config.ts', 'Next.js 配置文件');
  allChecksPass &= checkFile('tsconfig.json', 'TypeScript 配置文件');
  allChecksPass &= checkFile('tailwind.config.ts', 'Tailwind CSS 配置文件');
  allChecksPass &= checkFile('README.md', 'README 文档');
  allChecksPass &= checkFile('NOTION_SETUP.md', 'Notion 配置指南');
  log('', 'reset');
  
  // 检查源代码目录
  log('📂 检查源代码结构:', 'blue');
  allChecksPass &= checkDirectory('src', 'src 目录');
  allChecksPass &= checkDirectory('src/app', 'src/app 目录');
  allChecksPass &= checkDirectory('src/components', 'src/components 目录');
  allChecksPass &= checkFile('src/app/layout.tsx', '根布局文件');
  allChecksPass &= checkFile('src/app/page.tsx', '首页文件');
  allChecksPass &= checkFile('src/components/Sidebar.tsx', '侧边栏组件');
  log('', 'reset');
  
  // 检查页面文件
  log('📄 检查页面文件:', 'blue');
  allChecksPass &= checkFile('src/app/environments/page.tsx', '环境管理页面');
  allChecksPass &= checkFile('src/app/users/page.tsx', '用户管理页面');
  allChecksPass &= checkFile('src/app/security/page.tsx', '安全中心页面');
  allChecksPass &= checkFile('src/app/analytics/page.tsx', '数据分析页面');
  allChecksPass &= checkFile('src/app/settings/page.tsx', '系统设置页面');
  allChecksPass &= checkFile('src/app/api/health/route.ts', '健康检查API');
  log('', 'reset');
  
  // 检查Notion自动登录模块
  log('🔧 检查Notion自动登录模块:', 'blue');
  allChecksPass &= checkDirectory('notion-auto-login', 'notion-auto-login 目录');
  allChecksPass &= checkDirectory('notion-auto-login/src/lib', 'lib 目录');
  allChecksPass &= checkDirectory('notion-auto-login/src/pages/api', 'API 目录');
  allChecksPass &= checkFile('notion-auto-login/src/lib/notion.js', 'Notion API 库');
  allChecksPass &= checkFile('notion-auto-login/src/pages/api/sites.js', '网站列表API');
  allChecksPass &= checkFile('notion-auto-login/src/pages/api/environments.js', '环境统计API');
  log('', 'reset');
  
  // 检查依赖
  log('📦 检查依赖包:', 'blue');
  allChecksPass &= checkPackageJson();
  log('', 'reset');
  
  // 检查环境配置
  log('⚙️  检查环境配置:', 'blue');
  allChecksPass &= checkEnvironmentFile();
  log('', 'reset');
  
  // 检查部署文件
  log('🚀 检查部署配置:', 'blue');
  allChecksPass &= checkFile('vercel.json', 'Vercel 配置文件');
  allChecksPass &= checkFile('Dockerfile', 'Docker 配置文件');
  allChecksPass &= checkFile('docker-compose.yml', 'Docker Compose 配置');
  allChecksPass &= checkFile('.github/workflows/deploy.yml', 'GitHub Actions 工作流');
  log('', 'reset');
  
  // 总结
  if (allChecksPass) {
    log('🎉 项目检查完成！所有核心文件都存在。', 'green');
    log('', 'reset');
    log('📋 下一步操作:', 'blue');
    log('1. 配置 .env.local 文件中的 Notion API 密钥', 'reset');
    log('2. 运行 npm run build 构建项目', 'reset');
    log('3. 运行 npm start 启动生产服务器', 'reset');
    log('4. 部署到 Vercel 或其他平台', 'reset');
  } else {
    log('⚠️  项目检查发现问题，请修复后重试。', 'yellow');
  }
  
  process.exit(allChecksPass ? 0 : 1);
}

main();
