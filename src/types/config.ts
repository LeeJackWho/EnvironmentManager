/**
 * 配置管理相关类型定义
 */

// 配置项类型
export type ConfigType = 'text' | 'password' | 'number' | 'boolean' | 'select' | 'textarea';

// 配置项接口
export interface ConfigItem {
  id: string;
  name: string;
  description: string;
  type: ConfigType;
  value: string | number | boolean;
  defaultValue?: string | number | boolean;
  required: boolean;
  category: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  sensitive?: boolean; // 是否为敏感信息（如密码、API Key）
  restartRequired?: boolean; // 修改后是否需要重启应用
}

// 配置分类
export interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

// 配置管理状态
export interface ConfigState {
  items: ConfigItem[];
  categories: ConfigCategory[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: string | null;
}

// 配置更新请求
export interface ConfigUpdateRequest {
  id: string;
  value: string | number | boolean;
}

// 配置验证结果
export interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{
    id: string;
    message: string;
  }>;
}

// 预定义配置项
export const DEFAULT_CONFIG_ITEMS: ConfigItem[] = [
  // Notion 配置
  {
    id: 'NOTION_API_KEY',
    name: 'Notion API Key',
    description: '从 https://www.notion.so/my-integrations 获取的 API 密钥',
    type: 'password',
    value: '',
    required: true,
    category: 'notion',
    placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sensitive: true,
    restartRequired: true,
    validation: {
      pattern: '^secret_[a-zA-Z0-9]{43}$',
      message: 'Notion API Key 格式不正确，应以 secret_ 开头'
    }
  },
  {
    id: 'NOTION_DATABASE_ID',
    name: 'Notion 数据库 ID',
    description: '环境管理数据库的 ID，从数据库 URL 中获取',
    type: 'text',
    value: '',
    required: true,
    category: 'notion',
    placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sensitive: false,
    restartRequired: true,
    validation: {
      pattern: '^[a-f0-9]{32}$',
      message: '数据库 ID 应为 32 位十六进制字符'
    }
  },
  
  // AI 模型配置 (Midscene.js 使用)
  {
    id: 'OPENAI_API_KEY',
    name: 'AI API Key',
    description: '支持 OpenAI (sk-...)、OpenRouter (sk-or-v1-...)、或其他兼容 OpenAI 格式的 API 服务',
    type: 'password',
    value: '',
    required: false,
    category: 'midscene',
    placeholder: 'sk-... 或 sk-or-v1-...',
    sensitive: true,
    restartRequired: false,
    validation: {
      pattern: '^sk-',
      message: 'API Key 应以 sk- 开头'
    }
  },
  {
    id: 'OPENAI_BASE_URL',
    name: 'API 基础 URL',
    description: 'API 服务地址。OpenAI 官方留空，OpenRouter: https://openrouter.ai/api/v1，其他服务填写相应地址',
    type: 'text',
    value: '',
    required: false,
    category: 'midscene',
    placeholder: 'https://openrouter.ai/api/v1 (可选)',
    restartRequired: false
  },
  {
    id: 'MIDSCENE_MODEL_NAME',
    name: '模型名称',
    description: '使用的 AI 模型名称，支持任何兼容 OpenAI Vision API 的模型',
    type: 'text',
    value: 'gpt-4-vision-preview',
    defaultValue: 'gpt-4-vision-preview',
    required: false,
    category: 'midscene',
    placeholder: 'gpt-4-vision-preview',
    restartRequired: false
  },
  {
    id: 'MIDSCENE_ENABLED',
    name: '启用智能验证码识别',
    description: '是否启用 AI 智能验证码识别功能（需要配置上述 API Key）',
    type: 'boolean',
    value: true,
    required: false,
    category: 'midscene',
    restartRequired: false
  },
  {
    id: 'MIDSCENE_CONFIDENCE_THRESHOLD',
    name: '置信度阈值',
    description: 'AI 识别结果的最低置信度要求（0.0-1.0）',
    type: 'number',
    value: 0.7,
    defaultValue: 0.7,
    required: false,
    category: 'midscene',
    validation: {
      min: 0,
      max: 1,
      message: '置信度阈值应在 0.0 到 1.0 之间'
    }
  },
  {
    id: 'MIDSCENE_TIMEOUT',
    name: '请求超时时间',
    description: 'AI API 请求的超时时间（秒）',
    type: 'number',
    value: 30,
    defaultValue: 30,
    required: false,
    category: 'midscene',
    validation: {
      min: 5,
      max: 300,
      message: '超时时间应在 5 到 300 秒之间'
    }
  },
  {
    id: 'MIDSCENE_MAX_RETRIES',
    name: '最大重试次数',
    description: 'API 请求失败时的最大重试次数',
    type: 'number',
    value: 3,
    defaultValue: 3,
    required: false,
    category: 'midscene',
    validation: {
      min: 0,
      max: 10,
      message: '重试次数应在 0 到 10 次之间'
    }
  },
  
  // 验证码服务配置
  {
    id: 'CAPTCHA_API_KEY',
    name: '第三方验证码 API Key',
    description: '第三方验证码识别服务的 API 密钥（可选）',
    type: 'password',
    value: '',
    required: false,
    category: 'captcha',
    placeholder: 'your_captcha_api_key_here',
    sensitive: true
  },
  {
    id: 'OCR_ENABLED',
    name: '启用 OCR 识别',
    description: '是否启用本地 OCR 验证码识别功能',
    type: 'boolean',
    value: true,
    defaultValue: true,
    required: false,
    category: 'captcha'
  },
  
  // 应用配置
  {
    id: 'APP_PORT',
    name: '应用端口',
    description: '应用运行的端口号',
    type: 'number',
    value: 3000,
    defaultValue: 3000,
    required: true,
    category: 'app',
    validation: {
      min: 1000,
      max: 65535,
      message: '端口号应在 1000 到 65535 之间'
    },
    restartRequired: true
  },
  {
    id: 'LOG_LEVEL',
    name: '日志级别',
    description: '应用日志的详细程度',
    type: 'select',
    value: 'info',
    defaultValue: 'info',
    required: true,
    category: 'app',
    options: [
      { label: 'Error（仅错误）', value: 'error' },
      { label: 'Warn（警告及以上）', value: 'warn' },
      { label: 'Info（信息及以上）', value: 'info' },
      { label: 'Debug（调试及以上）', value: 'debug' }
    ]
  },
  {
    id: 'SESSION_TIMEOUT',
    name: '会话超时时间',
    description: '浏览器会话的超时时间（分钟）',
    type: 'number',
    value: 30,
    defaultValue: 30,
    required: false,
    category: 'app',
    validation: {
      min: 5,
      max: 1440,
      message: '会话超时时间应在 5 到 1440 分钟之间'
    }
  },
  
  // 安全配置
  {
    id: 'ENABLE_HTTPS',
    name: '启用 HTTPS',
    description: '是否启用 HTTPS 安全连接',
    type: 'boolean',
    value: false,
    defaultValue: false,
    required: false,
    category: 'security',
    restartRequired: true
  },
  {
    id: 'JWT_SECRET',
    name: 'JWT 密钥',
    description: '用于身份验证的 JWT 密钥（如果启用身份验证）',
    type: 'password',
    value: '',
    required: false,
    category: 'security',
    placeholder: 'your_jwt_secret_here',
    sensitive: true,
    restartRequired: true
  }
];

// 配置分类定义
export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'notion',
    name: 'Notion 配置',
    description: 'Notion API 和数据库相关配置',
    icon: '📝',
    order: 1
  },
  {
    id: 'midscene',
    name: 'Midscene.js 配置',
    description: '智能验证码识别服务配置',
    icon: '🤖',
    order: 2
  },
  {
    id: 'captcha',
    name: '验证码服务',
    description: '验证码识别相关配置',
    icon: '🛡️',
    order: 3
  },
  {
    id: 'app',
    name: '应用配置',
    description: '应用运行相关的基础配置',
    icon: '⚙️',
    order: 4
  },
  {
    id: 'security',
    name: '安全配置',
    description: '安全和身份验证相关配置',
    icon: '🔒',
    order: 5
  }
];
