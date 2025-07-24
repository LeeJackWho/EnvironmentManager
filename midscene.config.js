/**
 * Midscene.js 配置文件
 * 参考 playwright-mind 项目的配置方式
 */

import { defineConfig } from '@midscene/web';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

export default defineConfig({
  // AI 模型配置
  ai: {
    // 使用 OpenRouter 或其他兼容 OpenAI 的服务
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.MIDSCENE_MODEL_NAME || 'qwen/qwen2.5-vl-72b-instruct:free',
    
    // 请求配置
    timeout: 60000,
    maxRetries: 3,
    
    // 额外的请求头（用于 OpenRouter）
    defaultHeaders: {
      'HTTP-Referer': 'https://environment-manager.local',
      'X-Title': 'Environment Manager - Captcha Recognition'
    }
  },
  
  // 验证码识别配置
  captcha: {
    // 支持的验证码类型
    supportedTypes: [
      'text',      // 文字验证码
      'click',     // 点击验证码
      'grid',      // 网格验证码
      'slider',    // 滑块验证码
      'rotate',    // 旋转验证码
      'logic',     // 逻辑验证码
      'drag',      // 拖拽验证码
      'sequence'   // 序列点击
    ],
    
    // 识别置信度阈值
    confidenceThreshold: 0.7,
    
    // 超时设置
    timeout: {
      recognition: 30000,  // 识别超时
      solving: 60000,      // 解决超时
      verification: 30000  // 验证超时
    },
    
    // 重试配置
    retry: {
      maxAttempts: 3,
      delay: 2000
    }
  },
  
  // 浏览器配置
  browser: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    timeout: 30000,
    
    // Playwright 启动参数
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    }
  },
  
  // 调试配置
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    screenshotOnError: true,
    saveScreenshots: true,
    screenshotDir: '.browser-sessions/screenshots',
    logLevel: 'info'
  },
  
  // 输出配置
  output: {
    reportDir: '.browser-sessions/reports',
    saveExecutionLogs: true,
    saveNetworkLogs: false
  }
});
