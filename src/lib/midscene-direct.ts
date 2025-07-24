/**
 * Midscene.js 直接集成模块 - 简化版
 * 使用简洁的 AI 指令方式进行验证码识别
 */

import { getMidsceneConfig } from './env';

// 验证码类型枚举
export type CaptchaType = 
  | 'text'        // 数字/字母组合的静态验证码
  | 'click'       // 点击验证码（点选文字/图像）
  | 'grid'        // 网格验证码（选择图片）
  | 'slider'      // 滑块拼图验证码
  | 'rotate'      // 旋转验证码
  | 'logic'       // 逻辑解题验证码
  | 'drag'        // 拖拽验证码
  | 'sequence'    // 按顺序点击
  | 'unknown';    // 未知类型

// 验证码识别结果接口
export interface CaptchaRecognitionResult {
  detected: boolean;
  type: CaptchaType;
  confidence: number;
  solution?: {
    text?: string;
    coordinates?: Array<{x: number, y: number}>;
    dragPath?: {from: {x: number, y: number}, to: {x: number, y: number}};
    rotationAngle?: number;
    sequence?: Array<{x: number, y: number, order: number}>;
  };
  elements: Array<{
    selector: string;
    type: string;
    position: { x: number; y: number; width: number; height: number };
    description: string;
  }>;
  instructions: string[];
  retryCount?: number;
}

// 验证码执行结果接口
export interface CaptchaExecutionResult {
  detected: boolean;
  solved: boolean;
  type: CaptchaType;
  message: string;
  retryCount?: number;
  executionSteps: Array<{step: string; success: boolean; error?: string}>;
}

// 模拟 ai() 函数，使用直接的 API 调用
async function ai(instruction: string, page: any): Promise<string> {
  const config = getMidsceneConfig();
  
  if (!config.apiKey) {
    throw new Error('未配置 AI API Key');
  }

  // 截图
  const screenshot = await page.screenshot({ type: 'png' });
  const imageBase64 = screenshot.toString('base64');

  // 构建优化的请求 - 专注于快速准确识别
  const requestBody = {
    model: config.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `识别图片中的验证码，只返回一个验证码的内容：

规则：
1. 如果有多个验证码，只返回第一个或最显眼的一个
2. 只返回验证码文字本身，如："ABCD"、"1234"、"X9M2"
3. 不要返回多行内容
4. 不要解释或描述
5. 如果是图片选择类验证码，返回："图片验证码"
6. 如果没有验证码，返回："无验证码"

示例：
- 看到 "AB7K" → 返回：AB7K
- 看到 "8529" → 返回：8529
- 看到点击图片 → 返回：图片验证码`
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`
          }
        }
      ]
    }],
    max_tokens: 50, // 大幅减少 token 数量
    temperature: 0, // 降低随机性，提高准确性
    top_p: 0.1 // 进一步提高确定性
  };

  // 发送请求 - 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://environment-manager.local',
        'X-Title': 'Environment Manager - Fast Captcha Recognition'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('AI 请求超时 (15秒)，验证码可能已失效');
    }
    throw error;
  }
}

/**
 * Midscene 直接客户端类
 * 使用简洁的 AI 指令方式
 */
export class MidsceneDirectClient {
  private config: any;
  private isInitialized = false;

  constructor() {
    this.config = getMidsceneConfig();
    this.initializeMidscene();
  }

  /**
   * 初始化 Midscene AI 配置
   */
  private async initializeMidscene() {
    if (this.isInitialized) return;

    try {
      // 检查配置
      if (!this.config.apiKey) {
        throw new Error('未配置 AI API Key');
      }

      this.isInitialized = true;
      console.log('✅ Midscene AI 初始化成功');
    } catch (error) {
      console.error('❌ Midscene AI 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 Midscene 客户端
   */
  async initialize(): Promise<boolean> {
    try {
      await this.initializeMidscene();

      // 检查环境变量（从 .env.local 加载）
      console.log('🔍 Midscene 配置检查:', {
        provider: this.config.provider,
        hasApiKey: !!this.config.apiKey,
        apiKeyPrefix: this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : '(未设置)',
        baseUrl: this.config.baseUrl || '(未设置)',
        model: this.config.model || '(未设置)',
        配置来源: '.env.local'
      });

      if (this.config.provider === 'none') {
        console.log('⚠️ 当前为模拟模式，未配置 AI API');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ Midscene 直接客户端初始化成功');
      return true;

    } catch (error) {
      console.error('❌ Midscene 直接客户端初始化失败:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * 智能识别并解决验证码 - 快速版本
   */
  async solveCaptchaDirectly(page: any, pageUrl?: string, maxRetries: number = 2): Promise<CaptchaExecutionResult> {
    console.log('⚡ 开始快速验证码识别...');
    const startTime = Date.now();

    let lastError: Error | null = null;
    const executionSteps: Array<{step: string; success: boolean; error?: string}> = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 第 ${attempt}/${maxRetries} 次尝试 (${Date.now() - startTime}ms)`);

        // 使用优化的快速识别指令
        const result = await ai('快速识别验证码内容', page);

        console.log('🤖 AI 响应:', result);
        executionSteps.push({step: `快速识别 (尝试 ${attempt})`, success: true});

        // 解析 AI 响应并执行操作
        const executionResult = await this.executeAIInstructions(page, result, attempt);

        if (executionResult.solved) {
          const totalTime = Date.now() - startTime;
          console.log(`✅ 验证码识别成功，总耗时: ${totalTime}ms`);

          return {
            ...executionResult,
            retryCount: attempt,
            executionSteps: [...executionSteps, ...executionResult.executionSteps]
          };
        }

        lastError = new Error(executionResult.message);
        executionSteps.push({step: `尝试 ${attempt} 失败`, success: false, error: executionResult.message});

        // 减少重试间隔时间
        if (attempt < maxRetries) {
          console.log(`⏳ 等待 1 秒后重试...`);
          await page.waitForTimeout(1000);
        }

      } catch (error) {
        lastError = error as Error;
        executionSteps.push({step: `尝试 ${attempt} 异常`, success: false, error: String(error)});
        console.error(`❌ 第 ${attempt} 次尝试失败:`, error);

        if (attempt < maxRetries) {
          await page.waitForTimeout(1000);
        }
      }
    }

    return {
      detected: false,
      solved: false,
      type: 'unknown',
      message: `所有 ${maxRetries} 次尝试都失败: ${lastError?.message || '未知错误'}`,
      retryCount: maxRetries,
      executionSteps
    };
  }

  /**
   * 执行 AI 指令
   */
  private async executeAIInstructions(page: any, aiResponse: string, attempt: number): Promise<CaptchaExecutionResult> {
    const executionSteps: Array<{step: string; success: boolean; error?: string}> = [];

    try {
      // 分析 AI 响应，提取验证码信息
      const analysis = this.analyzeAIResponse(aiResponse);
      
      if (!analysis.detected) {
        return {
          detected: false,
          solved: false,
          type: 'unknown',
          message: '未检测到验证码',
          executionSteps
        };
      }

      // 根据识别的类型执行相应操作
      const result = await this.performCaptchaActions(page, analysis, executionSteps);
      
      return {
        detected: true,
        solved: result.success,
        type: analysis.type,
        message: result.message,
        executionSteps
      };

    } catch (error) {
      executionSteps.push({step: '执行 AI 指令失败', success: false, error: String(error)});
      return {
        detected: false,
        solved: false,
        type: 'unknown',
        message: `执行失败: ${error}`,
        executionSteps
      };
    }
  }

  /**
   * 快速分析 AI 响应 - 优化版
   */
  private analyzeAIResponse(response: string): CaptchaRecognitionResult {
    console.log('🔍 AI 原始响应:', response);

    const cleanResponse = response.trim();
    let detected = false;
    let type: CaptchaType = 'unknown';
    let solution: any = {};
    let confidence = 0.1;

    // 快速检测：如果响应是"无验证码"
    if (cleanResponse.includes('无验证码') || cleanResponse.includes('没有验证码')) {
      return {
        detected: false,
        type: 'unknown',
        confidence: 0.9,
        solution: {},
        elements: [],
        instructions: ['未检测到验证码']
      };
    }

    // 快速检测：如果响应是"图片验证码"
    if (cleanResponse.includes('图片验证码')) {
      return {
        detected: true,
        type: 'click',
        confidence: 0.8,
        solution: {},
        elements: [],
        instructions: ['检测到图片验证码，需要手动处理']
      };
    }

    // 清理响应，移除换行和多余空格
    const singleLineResponse = cleanResponse.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // 快速提取文字验证码 - 优化的模式匹配
    const patterns = [
      /^([A-Z0-9]{3,8})$/,         // 完全匹配：纯大写字母数字
      /^([a-z0-9]{3,8})$/,         // 完全匹配：纯小写字母数字
      /^([A-Za-z0-9]{3,8})$/,      // 完全匹配：混合字母数字
      /\b([A-Z0-9]{3,8})\b/,       // 单词边界：大写字母数字
      /\b([a-z0-9]{3,8})\b/,       // 单词边界：小写字母数字
      /\b([A-Za-z0-9]{3,8})\b/,    // 单词边界：混合字母数字
      /([A-Z]{2,4}[0-9]{1,4})/,    // 字母+数字组合
      /([0-9]{3,6})/,              // 纯数字
      /([A-Z]{3,6})/               // 纯字母
    ];

    for (const pattern of patterns) {
      const match = singleLineResponse.match(pattern);
      if (match) {
        const captchaText = match[1] || match[0];

        // 验证提取的文字是否合理
        if (captchaText && captchaText.length >= 3 && captchaText.length <= 8) {
          // 排除常见的干扰词
          const excludeWords = ['图片', '验证码', 'captcha', 'code', '请输入', '输入'];
          const isExcluded = excludeWords.some(word =>
            captchaText.toLowerCase().includes(word.toLowerCase())
          );

          if (!isExcluded) {
            console.log('✅ 提取到验证码文字:', captchaText);

            return {
              detected: true,
              type: 'text',
              confidence: 0.9,
              solution: { text: captchaText },
              elements: [],
              instructions: [`识别到文字验证码: ${captchaText}`]
            };
          }
        }
      }
    }

    // 如果没有匹配到明确的验证码，但响应包含可能的验证码内容
    if (cleanResponse.length >= 3 && cleanResponse.length <= 10) {
      // 移除常见的干扰词
      const filtered = cleanResponse
        .replace(/验证码|captcha|code|请输入|输入|是|为/gi, '')
        .replace(/[^\w]/g, '') // 只保留字母数字
        .trim();

      if (filtered.length >= 3 && filtered.length <= 8) {
        console.log('⚠️ 尝试提取可能的验证码:', filtered);

        return {
          detected: true,
          type: 'text',
          confidence: 0.6, // 较低的置信度
          solution: { text: filtered },
          elements: [],
          instructions: [`可能的验证码: ${filtered} (置信度较低)`]
        };
      }
    }

    // 默认返回未检测到
    return {
      detected: false,
      type: 'unknown',
      confidence: 0.1,
      solution: {},
      elements: [],
      instructions: ['无法识别验证码内容']
    };
  }

  /**
   * 执行验证码操作
   */
  private async performCaptchaActions(page: any, analysis: CaptchaRecognitionResult, steps: Array<{step: string; success: boolean; error?: string}>): Promise<{success: boolean; message: string}> {
    
    switch (analysis.type) {
      case 'text':
        return await this.handleTextCaptcha(page, analysis, steps);
      case 'click':
        return await this.handleClickCaptcha(page, analysis, steps);
      case 'slider':
        return await this.handleSliderCaptcha(page, analysis, steps);
      default:
        steps.push({step: `未支持的验证码类型: ${analysis.type}`, success: false});
        return {success: false, message: `未支持的验证码类型: ${analysis.type}`};
    }
  }

  /**
   * 处理文字验证码 - 优化版
   */
  private async handleTextCaptcha(page: any, analysis: CaptchaRecognitionResult, steps: Array<{step: string; success: boolean; error?: string}>): Promise<{success: boolean; message: string}> {

    const captchaText = analysis.solution?.text;
    if (!captchaText) {
      steps.push({step: '未能识别验证码文字', success: false});
      return {success: false, message: '未能识别验证码文字'};
    }

    console.log(`⚡ 快速输入验证码: ${captchaText}`);

    // 优化的验证码输入框选择器 - 按常见程度排序
    const inputSelectors = [
      'input[name="captcha"]',
      'input[name="code"]',
      'input[name="verifyCode"]',
      'input[name="verify"]',
      'input[placeholder*="验证码"]',
      'input[placeholder*="captcha"]',
      'input[type="text"][name*="captcha"]',
      'input[type="text"][name*="code"]',
      '.captcha-input',
      '#captcha',
      '#verifyCode',
      '#code'
    ];

    // 并行检查所有输入框，找到第一个可见的
    const promises = inputSelectors.map(async (selector) => {
      try {
        const input = page.locator(selector).first();
        const isVisible = await input.isVisible({ timeout: 500 });
        return isVisible ? { selector, input } : null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const availableInput = results.find(result => result !== null);

    if (availableInput) {
      try {
        // 清空输入框并输入验证码
        await availableInput.input.clear();
        await availableInput.input.fill(captchaText);

        // 验证输入是否成功
        const inputValue = await availableInput.input.inputValue();
        if (inputValue === captchaText) {
          steps.push({step: `快速输入验证码: ${captchaText} (${availableInput.selector})`, success: true});
          console.log(`✅ 验证码输入成功: ${captchaText}`);
          return {success: true, message: `成功输入验证码: ${captchaText}`};
        } else {
          steps.push({step: `验证码输入验证失败: 期望 ${captchaText}, 实际 ${inputValue}`, success: false});
          return {success: false, message: '验证码输入验证失败'};
        }
      } catch (error) {
        steps.push({step: `输入验证码失败: ${error}`, success: false});
        return {success: false, message: `输入验证码失败: ${error}`};
      }
    }

    steps.push({step: '未找到可用的验证码输入框', success: false});
    return {success: false, message: '未找到可用的验证码输入框'};
  }

  /**
   * 处理点击验证码
   */
  private async handleClickCaptcha(page: any, analysis: CaptchaRecognitionResult, steps: Array<{step: string; success: boolean; error?: string}>): Promise<{success: boolean; message: string}> {
    steps.push({step: '点击验证码处理（待实现）', success: false});
    return {success: false, message: '点击验证码处理功能待实现'};
  }

  /**
   * 处理滑块验证码
   */
  private async handleSliderCaptcha(page: any, analysis: CaptchaRecognitionResult, steps: Array<{step: string; success: boolean; error?: string}>): Promise<{success: boolean; message: string}> {
    steps.push({step: '滑块验证码处理（待实现）', success: false});
    return {success: false, message: '滑块验证码处理功能待实现'};
  }

  /**
   * 断开连接（兼容性方法）
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Midscene 直接客户端断开连接');
    this.isInitialized = false;
  }
}

/**
 * 创建 Midscene 直接客户端实例
 */
export function createMidsceneDirectClient(): MidsceneDirectClient {
  return new MidsceneDirectClient();
}
