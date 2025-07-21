import Tesseract from 'tesseract.js';

/**
 * 识别图形验证码
 * @param {string} base64Image - Base64编码的图片
 * @returns {Promise<string>} - 识别结果
 */
export async function recognizeImageCaptcha(base64Image) {
  try {
    console.log('开始识别图形验证码...');
    
    // 预处理图片（可选）
    // 这里可以添加图片预处理逻辑，如二值化、去噪等
    
    // 使用Tesseract.js识别验证码
    const { data: { text } } = await Tesseract.recognize(
      `data:image/png;base64,${base64Image}`,
      'eng', // 使用英文训练数据
      {
        logger: m => console.log(m),
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', // 限制识别字符集
      }
    );
    
    // 清理识别结果（去除空格和特殊字符）
    const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '');
    
    console.log(`验证码识别结果: ${cleanedText}`);
    return cleanedText;
  } catch (error) {
    console.error('验证码识别失败:', error);
    return '';
  }
}

/**
 * 使用第三方API识别验证码（备选方案）
 * 如果自建OCR效果不佳，可以接入第三方服务
 */
export async function recognizeCaptchaWithAPI(base64Image) {
  try {
    // 这里替换为实际的第三方API调用
    // 例如 2Captcha, Anti-Captcha 等服务
    
    // 示例代码（需要替换为实际API）
    const response = await fetch('https://api.example.com/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: process.env.CAPTCHA_API_KEY,
        image: base64Image,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.text;
    } else {
      throw new Error(result.error || '识别失败');
    }
  } catch (error) {
    console.error('第三方API验证码识别失败:', error);
    return '';
  }
}
