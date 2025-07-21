/**
 * Midscene.js 配置文件
 * 用于智能验证码识别和页面元素分析
 */

module.exports = {
  // 基础配置
  apiKey: process.env.MIDSCENE_API_KEY,
  
  // MCP 服务器配置
  mcpServer: {
    port: 3001,
    host: 'localhost',
    timeout: 60000,
  },

  // 验证码识别配置
  captcha: {
    // 支持的验证码类型
    supportedTypes: [
      'text',      // 文字验证码
      'image',     // 图片验证码
      'slider',    // 滑动验证码
      'click',     // 点击验证码
      'puzzle',    // 拼图验证码
    ],
    
    // 识别置信度阈值
    confidenceThreshold: 0.7,
    
    // 解决置信度阈值
    solveThreshold: 0.8,
    
    // 超时设置
    timeout: {
      analysis: 30000,    // 分析超时
      solve: 60000,       // 解决超时
      verify: 30000,      // 验证超时
    },
    
    // 重试配置
    retry: {
      maxAttempts: 3,
      delay: 2000,
    }
  },

  // 页面分析配置
  pageAnalysis: {
    // 目标元素类型
    targetElements: [
      'username',
      'password', 
      'submit_button',
      'captcha',
      'error_message',
      'success_indicator'
    ],
    
    // 分析模式
    analysisMode: 'comprehensive', // 'fast' | 'comprehensive'
    
    // 截图配置
    screenshot: {
      fullPage: true,
      quality: 90,
      format: 'png'
    }
  },

  // 自动化配置
  automation: {
    // 操作延迟
    actionDelay: 1000,
    
    // 等待超时
    waitTimeout: 10000,
    
    // 支持的操作类型
    supportedActions: [
      'input',
      'click', 
      'drag',
      'wait',
      'scroll'
    ]
  },

  // 日志配置
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    enableConsole: true,
    enableFile: true,
    logDir: './.browser-sessions/logs'
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 3600000, // 1小时
    maxSize: 100
  }
};
