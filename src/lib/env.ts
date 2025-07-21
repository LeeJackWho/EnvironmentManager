/**
 * 环境变量工具函数
 * 确保在不同上下文中都能正确加载环境变量
 */

// 在服务器端手动加载 .env.local 文件
let envLoaded = false;

function loadEnvFile() {
  if (envLoaded || typeof window !== 'undefined') return;

  try {
    const fs = require('fs');
    const path = require('path');
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

      envLoaded = true;
      console.log('✅ .env.local 文件加载成功');
    } else {
      console.warn('⚠️ .env.local 文件不存在');
    }
  } catch (error) {
    console.warn('⚠️ 加载 .env.local 失败:', error);
  }
}

// 立即加载环境变量
loadEnvFile();

/**
 * 获取 Notion API 密钥
 */
export function getNotionApiKey(): string | undefined {
  loadEnvFile(); // 确保环境变量已加载
  return process.env.NOTION_API_KEY ||
         process.env.NEXT_PUBLIC_NOTION_API_KEY ||
         undefined;
}

/**
 * 获取 Notion 数据库 ID
 */
export function getNotionDatabaseId(): string | undefined {
  loadEnvFile(); // 确保环境变量已加载
  return process.env.NOTION_DATABASE_ID ||
         process.env.NEXT_PUBLIC_NOTION_DATABASE_ID ||
         undefined;
}

/**
 * 检查环境变量是否配置完整
 */
export function checkEnvConfig(): {
  isValid: boolean;
  apiKey?: string;
  databaseId?: string;
  errors: string[];
} {
  const apiKey = getNotionApiKey();
  const databaseId = getNotionDatabaseId();
  const errors: string[] = [];

  if (!apiKey) {
    errors.push('NOTION_API_KEY 未配置');
  }

  if (!databaseId) {
    errors.push('NOTION_DATABASE_ID 未配置');
  }

  return {
    isValid: errors.length === 0,
    apiKey,
    databaseId,
    errors
  };
}

/**
 * 获取验证码 API 密钥（可选）
 */
export function getCaptchaApiKey(): string | undefined {
  return process.env.CAPTCHA_API_KEY || 
         process.env.NEXT_PUBLIC_CAPTCHA_API_KEY ||
         undefined;
}

/**
 * 调试环境变量信息
 */
export function debugEnvVars() {
  if (typeof window !== 'undefined') {
    console.log('🌐 客户端环境变量调试');
    return;
  }

  console.log('🔍 服务器端环境变量调试:', {
    nodeEnv: process.env.NODE_ENV,
    hasNotionApiKey: !!getNotionApiKey(),
    hasNotionDatabaseId: !!getNotionDatabaseId(),
    hasCaptchaApiKey: !!getCaptchaApiKey(),
    notionApiKeyPrefix: getNotionApiKey()?.substring(0, 10) + '...',
    allNotionKeys: Object.keys(process.env).filter(key => key.includes('NOTION')),
    envFileExists: require('fs').existsSync('.env.local')
  });
}
