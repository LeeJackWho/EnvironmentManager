/**
 * 验证码调试工具
 * 用于诊断和调试验证码处理过程中的问题
 */

import fs from 'fs';
import path from 'path';
import { getMidsceneApiKey, getMidsceneApiBase, checkMidsceneConfig, debugEnvVars } from './env';

export interface CaptchaDebugInfo {
  timestamp: string;
  sessionId: string;
  captchaType: string;
  pageUrl: string;
  screenshots: {
    initial?: string;
    analysis?: string;
    beforeSolve?: string;
    afterSolve?: string;
    final?: string;
  };
  midsceneConfig: {
    isValid: boolean;
    hasApiKey: boolean;
    apiKeyPrefix?: string;
    apiBase: string;
    errors: string[];
  };
  analysisResult?: any;
  solutionResult?: any;
  executionSteps: Array<{
    step: string;
    success: boolean;
    error?: string;
    timestamp: string;
  }>;
  finalResult: {
    detected: boolean;
    solved: boolean;
    message: string;
  };
}

/**
 * 验证码调试器类
 */
export class CaptchaDebugger {
  private debugInfo: CaptchaDebugInfo;
  private sessionDir: string;

  constructor(sessionId: string, sessionDir: string, captchaType: string, pageUrl: string) {
    this.sessionDir = sessionDir;
    this.debugInfo = {
      timestamp: new Date().toISOString(),
      sessionId,
      captchaType,
      pageUrl,
      screenshots: {},
      midsceneConfig: this.getMidsceneConfigInfo(),
      executionSteps: [],
      finalResult: {
        detected: false,
        solved: false,
        message: '调试中...'
      }
    };

    // 确保调试目录存在
    this.ensureDebugDir();
    
    // 输出初始调试信息
    this.logDebugInfo('🔍 验证码调试器初始化', {
      sessionId,
      captchaType,
      pageUrl,
      configValid: this.debugInfo.midsceneConfig.isValid
    });
  }

  /**
   * 获取 Midscene 配置信息
   */
  private getMidsceneConfigInfo() {
    const config = checkMidsceneConfig();
    const apiKey = getMidsceneApiKey();
    
    return {
      isValid: config.isValid,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : undefined,
      apiBase: getMidsceneApiBase(),
      errors: config.errors
    };
  }

  /**
   * 确保调试目录存在
   */
  private ensureDebugDir(): void {
    const debugDir = path.join(this.sessionDir, 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
  }

  /**
   * 记录调试信息
   */
  private logDebugInfo(message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    console.log(`🐛 [CaptchaDebugger] ${message}`, data || '');
    
    // 保存到调试日志文件
    const logFile = path.join(this.sessionDir, 'debug', 'captcha-debug.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 记录截图
   */
  recordScreenshot(type: keyof CaptchaDebugInfo['screenshots'], screenshotPath: string): void {
    this.debugInfo.screenshots[type] = screenshotPath;
    this.logDebugInfo(`📸 截图记录: ${type}`, { path: screenshotPath });
  }

  /**
   * 记录分析结果
   */
  recordAnalysisResult(result: any): void {
    this.debugInfo.analysisResult = result;
    this.logDebugInfo('📊 验证码分析结果', {
      type: result.type,
      confidence: result.confidence,
      elementsCount: result.elements?.length || 0,
      cached: result.cached
    });
  }

  /**
   * 记录解决方案结果
   */
  recordSolutionResult(result: any): void {
    this.debugInfo.solutionResult = result;
    this.logDebugInfo('🎯 验证码解决方案', {
      solution: result.solution,
      confidence: result.confidence,
      stepsCount: result.steps?.length || 0
    });
  }

  /**
   * 记录执行步骤
   */
  recordExecutionStep(step: string, success: boolean, error?: string): void {
    const stepInfo = {
      step,
      success,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.debugInfo.executionSteps.push(stepInfo);
    this.logDebugInfo(`${success ? '✅' : '❌'} 执行步骤: ${step}`, { success, error });
  }

  /**
   * 记录最终结果
   */
  recordFinalResult(detected: boolean, solved: boolean, message: string): void {
    this.debugInfo.finalResult = { detected, solved, message };
    this.logDebugInfo('🏁 验证码处理完成', { detected, solved, message });
  }

  /**
   * 生成调试报告
   */
  generateDebugReport(): string {
    const report = {
      ...this.debugInfo,
      summary: {
        totalSteps: this.debugInfo.executionSteps.length,
        successfulSteps: this.debugInfo.executionSteps.filter(s => s.success).length,
        failedSteps: this.debugInfo.executionSteps.filter(s => !s.success).length,
        configIssues: this.debugInfo.midsceneConfig.errors,
        recommendations: this.generateRecommendations()
      }
    };

    const reportPath = path.join(this.sessionDir, 'debug', 'captcha-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logDebugInfo('📋 调试报告已生成', { reportPath });
    
    return reportPath;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 配置相关建议
    if (!this.debugInfo.midsceneConfig.isValid) {
      recommendations.push('检查 Midscene API 配置，确保 MIDSCENE_API_KEY 正确设置');
    }
    
    if (!this.debugInfo.midsceneConfig.hasApiKey) {
      recommendations.push('配置有效的 MIDSCENE_API_KEY 以启用真实验证码识别');
    }
    
    // 分析结果相关建议
    if (this.debugInfo.analysisResult) {
      if (this.debugInfo.analysisResult.confidence < 0.7) {
        recommendations.push('验证码识别置信度较低，考虑使用传统方法或手动处理');
      }
      
      if (this.debugInfo.analysisResult.elements.length === 0) {
        recommendations.push('未检测到验证码元素，检查页面结构或验证码类型设置');
      }
    }
    
    // 执行步骤相关建议
    const failedSteps = this.debugInfo.executionSteps.filter(s => !s.success);
    if (failedSteps.length > 0) {
      recommendations.push(`${failedSteps.length} 个执行步骤失败，检查页面元素选择器和操作逻辑`);
    }
    
    // 最终结果相关建议
    if (!this.debugInfo.finalResult.solved) {
      recommendations.push('验证码未能自动解决，建议手动完成或优化识别策略');
    }
    
    return recommendations;
  }

  /**
   * 输出环境调试信息
   */
  static debugEnvironment(): void {
    console.log('🔍 开始环境调试...');
    debugEnvVars();
    
    const config = checkMidsceneConfig();
    console.log('🤖 Midscene 配置检查:', config);
    
    if (!config.isValid) {
      console.warn('⚠️ Midscene 配置问题:', config.errors);
      console.log('💡 解决建议:');
      config.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
  }
}

/**
 * 创建验证码调试器实例
 */
export function createCaptchaDebugger(
  sessionId: string, 
  sessionDir: string, 
  captchaType: string, 
  pageUrl: string
): CaptchaDebugger {
  return new CaptchaDebugger(sessionId, sessionDir, captchaType, pageUrl);
}
