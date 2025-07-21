import { createWorker } from 'tesseract.js';

/**
 * 图形验证码识别配置
 */
const OCR_CONFIG = {
  // Tesseract 配置
  tesseract: {
    lang: 'eng+chi_sim', // 支持英文和简体中文
    options: {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      tessedit_pageseg_mode: '8', // 单词模式
      tessedit_ocr_engine_mode: '1', // LSTM OCR引擎
    }
  },
  
  // 图像预处理配置
  preprocessing: {
    // 是否启用图像预处理
    enabled: true,
    // 二值化阈值
    threshold: 128,
    // 是否去噪
    denoise: true,
    // 是否增强对比度
    enhanceContrast: true,
  }
};

/**
 * 使用 Tesseract.js 识别图形验证码
 * @param imageBase64 - Base64编码的图片数据
 * @returns 识别出的文本
 */
export async function recognizeImageCaptcha(imageBase64: string): Promise<string> {
  let worker = null;
  
  try {
    console.log('🔍 开始识别图形验证码...');
    
    // 创建 Tesseract worker
    worker = await createWorker();
    
    // 初始化语言包
    await worker.loadLanguage(OCR_CONFIG.tesseract.lang);
    await worker.initialize(OCR_CONFIG.tesseract.lang);
    
    // 设置参数
    for (const [key, value] of Object.entries(OCR_CONFIG.tesseract.options)) {
      await worker.setParameters({
        [key]: value,
      });
    }
    
    // 预处理图像（如果启用）
    let processedImage = imageBase64;
    if (OCR_CONFIG.preprocessing.enabled) {
      processedImage = await preprocessImage(imageBase64);
    }
    
    // 执行OCR识别
    const { data: { text } } = await worker.recognize(processedImage);
    
    // 清理识别结果
    const cleanedText = cleanOCRResult(text);
    
    console.log(`✅ 验证码识别完成: "${cleanedText}"`);
    return cleanedText;
    
  } catch (error) {
    console.error('❌ 验证码识别失败:', error);
    
    // 如果 Tesseract 失败，尝试简单的模式识别
    return await fallbackRecognition(imageBase64);
    
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * 图像预处理
 * @param imageBase64 - 原始图像的Base64数据
 * @returns 处理后的图像Base64数据
 */
async function preprocessImage(imageBase64: string): Promise<string> {
  try {
    // 在浏览器环境中，我们可以使用 Canvas API 进行图像处理
    // 在 Node.js 环境中，这里返回原图
    if (typeof window === 'undefined') {
      return imageBase64;
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 图像处理：二值化、去噪、增强对比度
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 转换为灰度
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          
          // 二值化
          const binary = gray > OCR_CONFIG.preprocessing.threshold ? 255 : 0;
          
          data[i] = binary;     // R
          data[i + 1] = binary; // G
          data[i + 2] = binary; // B
          // Alpha 通道保持不变
        }
        
        // 将处理后的数据绘制回画布
        ctx.putImageData(imageData, 0, 0);
        
        // 转换为 Base64
        const processedBase64 = canvas.toDataURL('image/png');
        resolve(processedBase64);
      };
      
      img.src = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
    });
    
  } catch (error) {
    console.warn('图像预处理失败，使用原图:', error);
    return imageBase64;
  }
}

/**
 * 清理OCR识别结果
 * @param rawText - 原始识别文本
 * @returns 清理后的文本
 */
function cleanOCRResult(rawText: string): string {
  if (!rawText) return '';
  
  // 移除空白字符和换行符
  let cleaned = rawText.replace(/\s+/g, '').trim();
  
  // 移除常见的OCR错误字符
  cleaned = cleaned.replace(/[^\w]/g, '');
  
  // 字符替换（常见OCR错误修正）
  const replacements: Record<string, string> = {
    '0': 'O', // 数字0可能被识别为字母O
    'O': '0', // 字母O可能被识别为数字0
    '1': 'l', // 数字1可能被识别为小写l
    'l': '1', // 小写l可能被识别为数字1
    'I': '1', // 大写I可能被识别为数字1
    '5': 'S', // 数字5可能被识别为字母S
    'S': '5', // 字母S可能被识别为数字5
    '8': 'B', // 数字8可能被识别为字母B
    'B': '8', // 字母B可能被识别为数字8
  };
  
  // 应用字符替换（可选，根据具体验证码特点调整）
  // for (const [from, to] of Object.entries(replacements)) {
  //   cleaned = cleaned.replace(new RegExp(from, 'g'), to);
  // }
  
  return cleaned;
}

/**
 * 备用识别方法
 * 当 Tesseract 失败时使用的简单模式识别
 * @param imageBase64 - 图像Base64数据
 * @returns 识别结果
 */
async function fallbackRecognition(imageBase64: string): Promise<string> {
  try {
    console.log('🔄 使用备用识别方法...');
    
    // 这里可以实现简单的模式匹配或调用其他OCR服务
    // 例如：百度OCR、腾讯OCR、阿里云OCR等
    
    // 目前返回空字符串，表示识别失败
    // 在实际应用中，可以集成多个OCR服务作为备用
    
    return '';
    
  } catch (error) {
    console.error('备用识别方法也失败了:', error);
    return '';
  }
}

/**
 * 验证码识别结果验证
 * @param text - 识别出的文本
 * @param expectedLength - 期望的验证码长度
 * @returns 是否为有效的验证码
 */
export function validateCaptchaResult(text: string, expectedLength: number = 4): boolean {
  if (!text || text.length !== expectedLength) {
    return false;
  }
  
  // 检查是否只包含字母和数字
  const validPattern = /^[A-Za-z0-9]+$/;
  return validPattern.test(text);
}

/**
 * 获取验证码识别的置信度
 * @param text - 识别出的文本
 * @returns 置信度分数 (0-1)
 */
export function getCaptchaConfidence(text: string): number {
  if (!text) return 0;
  
  // 基于文本特征计算置信度
  let confidence = 0.5; // 基础置信度
  
  // 长度合理性
  if (text.length >= 3 && text.length <= 6) {
    confidence += 0.2;
  }
  
  // 字符类型多样性
  const hasNumbers = /\d/.test(text);
  const hasLetters = /[A-Za-z]/.test(text);
  if (hasNumbers && hasLetters) {
    confidence += 0.2;
  }
  
  // 没有特殊字符
  if (!/[^A-Za-z0-9]/.test(text)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}
