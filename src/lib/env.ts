/**
 * 环境变量工具函数
 * 确保在不同上下文中都能正确加载环境变量
 */

import fs from 'fs';
import path from 'path';

// 在服务器端手动加载 .env.local 文件
let envLoaded = false;

function loadEnvFile() {
  if (envLoaded || typeof window !== 'undefined') return;

  try {
    const envPath = path.join(process.cwd(), '.env.local');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach((line: string) => {
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
 * 获取 Midscene API 密钥（统一使用 OPENAI_API_KEY）
 * 支持 OpenAI、OpenRouter 和其他兼容 OpenAI 格式的 API 服务
 */
export function getMidsceneApiKey(): string | undefined {
  loadEnvFile(); // 确保环境变量已加载
  // 统一使用 OPENAI_API_KEY，支持多种服务商
  return process.env.OPENAI_API_KEY ||           // 主要 API Key
         process.env.MIDSCENE_API_KEY ||         // 向后兼容
         process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
         undefined;
}

/**
 * 获取 Midscene 配置信息（简化版）
 */
export function getMidsceneConfig(): {
  apiKey?: string;
  provider: string;
  endpoint?: string;
  model?: string;
  baseUrl?: string;
} {
  loadEnvFile();

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const model = process.env.MIDSCENE_MODEL_NAME || 'gpt-4-vision-preview';

  if (!apiKey) {
    return {
      provider: 'none'
    };
  }

  // 根据 API Key 和 Base URL 检测提供商
  let provider = 'openai'; // 默认

  if (apiKey.startsWith('sk-or-')) {
    provider = 'openrouter';
  } else if (baseUrl && !baseUrl.includes('api.openai.com')) {
    provider = 'custom';
  }

  return {
    apiKey,
    provider,
    baseUrl,
    model,
    endpoint: baseUrl // 兼容性
  };
}

/**
 * 获取 Midscene API 基础 URL（通常由 Midscene.js 自动处理）
 */
export function getMidsceneApiBase(): string {
  loadEnvFile(); // 确保环境变量已加载
  // Midscene.js 会根据 API Key 类型自动选择正确的 API Base
  return process.env.MIDSCENE_API_BASE ||
         process.env.NEXT_PUBLIC_MIDSCENE_API_BASE ||
         'auto'; // 让 Midscene.js 自动选择
}

/**
 * 获取 Midscene 模型名称
 */
export function getMidsceneModelName(): string {
  loadEnvFile(); // 确保环境变量已加载
  return process.env.MIDSCENE_MODEL_NAME ||
         process.env.NEXT_PUBLIC_MIDSCENE_MODEL_NAME ||
         'gpt-4-vision-preview'; // OpenAI 默认模型
}

/**
 * 检查 Midscene 配置是否有效（按照官方文档标准）
 */
export function checkMidsceneConfig(): {
  isValid: boolean;
  provider: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  errors: string[];
  warnings: string[];
} {
  const config = getMidsceneConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.provider === 'none') {
    errors.push('未配置任何 AI 模型 API Key');
    errors.push('支持的配置：OPENAI_API_KEY, GOOGLE_API_KEY, AZURE_OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_BASE_URL');
  } else {
    // 根据不同提供商进行特定检查
    switch (config.provider) {
      case 'openai':
        if (!config.apiKey?.startsWith('sk-')) {
          warnings.push('API Key 格式可能不正确（OpenAI 应以 sk- 开头）');
        }
        break;

      case 'openrouter':
        if (!config.apiKey?.startsWith('sk-or-')) {
          warnings.push('API Key 格式可能不正确（OpenRouter 应以 sk-or- 开头）');
        }
        if (config.baseUrl && !config.baseUrl.includes('openrouter.ai')) {
          warnings.push('OpenRouter 建议使用 https://openrouter.ai/api/v1');
        }
        break;

      case 'custom':
        if (!config.apiKey?.startsWith('sk-')) {
          warnings.push('API Key 格式可能不正确（通常应以 sk- 开头）');
        }
        if (!config.baseUrl) {
          warnings.push('自定义服务建议配置 OPENAI_BASE_URL');
        } else {
          try {
            new URL(config.baseUrl);
          } catch {
            errors.push('OPENAI_BASE_URL 格式不正确');
          }
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    provider: config.provider,
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    model: config.model,
    errors,
    warnings
  };
}

/**
 * 调试环境变量信息
 */
export function debugEnvVars() {
  if (typeof window !== 'undefined') {
    console.log('🌐 客户端环境变量调试');
    return;
  }

  const midsceneConfig = checkMidsceneConfig();
  const midsceneFullConfig = getMidsceneConfig();

  console.log('🔍 服务器端环境变量调试:', {
    nodeEnv: process.env.NODE_ENV,
    hasNotionApiKey: !!getNotionApiKey(),
    hasNotionDatabaseId: !!getNotionDatabaseId(),
    hasCaptchaApiKey: !!getCaptchaApiKey(),
    hasMidsceneApiKey: !!getMidsceneApiKey(),
    notionApiKeyPrefix: getNotionApiKey()?.substring(0, 10) + '...',
    midsceneProvider: midsceneFullConfig.provider,
    midsceneApiKeyPrefix: midsceneFullConfig.apiKey?.substring(0, 10) + '...',
    midsceneModel: midsceneFullConfig.model,
    midsceneEndpoint: midsceneFullConfig.endpoint,
    midsceneBaseUrl: midsceneFullConfig.baseUrl,
    midsceneConfigValid: midsceneConfig.isValid,
    midsceneConfigErrors: midsceneConfig.errors,
    midsceneConfigWarnings: midsceneConfig.warnings,
    allNotionKeys: Object.keys(process.env).filter(key => key.includes('NOTION')),
    allAiKeys: Object.keys(process.env).filter(key =>
      key.includes('OPENAI') ||
      key.includes('GOOGLE') ||
      key.includes('AZURE') ||
      key.includes('ANTHROPIC') ||
      key.includes('OLLAMA') ||
      key.includes('MIDSCENE')
    ),
    envFileExists: fs.existsSync('.env.local')
  });
}
