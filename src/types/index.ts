/**
 * 环境管理系统类型定义
 * 定义了系统中使用的所有数据类型和接口
 */

// ==================== 基础数据类型 ====================

/**
 * 网站配置接口
 * 表示一个网站的完整配置信息
 */
export interface Site {
  id: string;                    // Notion 页面 ID
  name: string;                  // 网站名称
  url: string;                   // 网站链接
  username: string;              // 登录用户名
  password: string;              // 登录密码
  captchaType: CaptchaType;      // 验证码类型
  status: LoginStatus;           // 登录状态
  environment: Environment;      // 环境分类
  cookies?: string | null;       // Cookie 数据
  notes?: string;                // 备注信息
}

/**
 * 环境分类枚举
 */
export type Environment = '测试环境' | '生产环境';

/**
 * 登录状态枚举
 */
export type LoginStatus = '未登录' | '已登录' | '登录失败';

/**
 * 验证码类型枚举
 */
export type CaptchaType = '无' | '图片验证码' | '滑块验证码';

// ==================== API 相关类型 ====================

/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;              // 操作是否成功
  message?: string;              // 响应消息
  data?: T;                      // 响应数据
  error?: string;                // 错误信息
}

/**
 * 添加网站表单数据接口
 */
export interface AddSiteFormData {
  name: string;                  // 网站名称
  url: string;                   // 网站链接
  username: string;              // 用户名
  password: string;              // 密码
  environment: Environment;      // 环境分类
  captchaType: CaptchaType;      // 验证码类型
  notes?: string;                // 备注
}

/**
 * 自动登录结果接口
 */
export interface LoginResult {
  success: boolean;              // 登录是否成功
  message: string;               // 登录消息
  cookies?: string;              // 获取的 Cookie
  status: LoginStatus;           // 登录状态
}

// ==================== Notion 相关类型 ====================

/**
 * Notion 数据库字段映射常量
 * 定义了代码中使用的字段名称与 Notion 数据库字段的对应关系
 */
export const NOTION_FIELDS = {
  NAME: 'Name',                  // 网站名称 (Title)
  URL: 'URL',                    // 网站链接 (URL)
  USERNAME: 'Username',          // 用户名 (Text)
  PASSWORD: 'Password',          // 密码 (Text)
  CATEGORY: 'Category',          // 环境分类 (Select)
  CAPTCHA_TYPE: 'CaptchaType',   // 验证码类型 (Select)
  STATUS: 'Status',              // 登录状态 (Status)
  COOKIES: 'Cookies',            // Cookie数据 (Text)
  DESCRIPTION: 'Description'     // 备注 (Text)
} as const;

/**
 * Notion 字段类型枚举
 */
export type NotionFieldType =
  | 'title'
  | 'rich_text'
  | 'url'
  | 'select'
  | 'status'
  | 'date'
  | 'checkbox'
  | 'number';

/**
 * Notion 选项接口
 */
export interface NotionOption {
  id: string;                    // 选项 ID
  name: string;                  // 选项名称
  color: string;                 // 选项颜色
}

/**
 * 数据库字段选项接口
 */
export interface DatabaseOptions {
  Category: NotionOption[];      // 环境分类选项
  CaptchaType: NotionOption[];   // 验证码类型选项
  Status: NotionOption[];        // 状态选项
}

// ==================== 组件相关类型 ====================

/**
 * 侧边栏菜单项接口
 */
export interface MenuItem {
  name: string;                  // 菜单名称
  href: string;                  // 链接地址
  icon: any;                     // 图标组件
  description: string;           // 描述信息
}

/**
 * 表单状态枚举
 */
export type FormState = 'idle' | 'submitting' | 'success' | 'error';

// ==================== 工具函数类型 ====================

/**
 * 状态颜色映射类型
 */
export type StatusColorMap = {
  [K in LoginStatus]: string;
};

/**
 * 环境颜色映射类型
 */
export type EnvironmentColorMap = {
  [K in Environment]: string;
};

// ==================== 导出默认配置 ====================

/**
 * 默认的状态颜色配置
 */
export const DEFAULT_STATUS_COLORS: StatusColorMap = {
  '未登录': 'bg-gray-100 text-gray-800 border-gray-200',
  '已登录': 'bg-green-100 text-green-800 border-green-200',
  '登录失败': 'bg-red-100 text-red-800 border-red-200'
};

/**
 * 默认的环境颜色配置
 */
export const DEFAULT_ENVIRONMENT_COLORS: EnvironmentColorMap = {
  '测试环境': 'bg-blue-100 text-blue-800 border-blue-200',
  '生产环境': 'bg-purple-100 text-purple-800 border-purple-200'
};
