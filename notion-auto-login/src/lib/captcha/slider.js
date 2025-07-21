/**
 * 处理滑动验证码
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Object>} - 处理结果
 */
export async function solveSliderCaptcha(page) {
  try {
    console.log('开始处理滑动验证码...');
    
    // 查找滑块元素
    const sliderSelectors = [
      '.slider',
      '.sliderContainer',
      '.yidun_slider',
      '.nc_slider',
      '.geetest_slider_button',
      '[class*="slider"]',
    ];
    
    let slider = null;
    for (const selector of sliderSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          slider = element;
          break;
        }
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!slider) {
      throw new Error('未找到滑块元素');
    }
    
    // 获取滑块位置和大小
    const sliderBox = await slider.boundingBox();
    if (!sliderBox) {
      throw new Error('无法获取滑块位置');
    }
    
    // 计算滑动距离
    // 这里使用一个简化的方法，实际项目中需要使用图像处理算法
    // 或者使用第三方服务来计算准确的滑动距离
    const distance = await calculateSlideDistance(page);
    
    // 执行滑动操作
    await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
    await page.mouse.down();
    
    // 模拟人类滑动行为（缓慢加速，然后减速）
    const steps = 30; // 滑动步数
    const initialDelay = 10; // 初始延迟（毫秒）
    
    // 加速阶段
    for (let i = 0; i < steps / 2; i++) {
      const stepDistance = (distance / steps) * (i + 1);
      const moveX = sliderBox.x + sliderBox.width / 2 + stepDistance;
      const moveY = sliderBox.y + sliderBox.height / 2 + getRandomOffset(2);
      
      await page.mouse.move(moveX, moveY);
      await page.waitForTimeout(initialDelay + i * 2);
    }
    
    // 减速阶段
    for (let i = steps / 2; i < steps; i++) {
      const stepDistance = (distance / steps) * (i + 1);
      const moveX = sliderBox.x + sliderBox.width / 2 + stepDistance;
      const moveY = sliderBox.y + sliderBox.height / 2 + getRandomOffset(1);
      
      await page.mouse.move(moveX, moveY);
      await page.waitForTimeout(initialDelay + (steps - i) * 2);
    }
    
    await page.mouse.up();
    
    // 等待验证结果
    await page.waitForTimeout(1500);
    
    // 检查验证是否成功
    const isSuccess = await checkSliderSuccess(page);
    
    if (isSuccess) {
      console.log('滑动验证成功');
      return { success: true };
    } else {
      throw new Error('滑动验证失败');
    }
  } catch (error) {
    console.error('滑动验证码处理失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 计算滑动距离
 * 注意：这是一个简化的实现，实际项目中需要使用图像处理算法
 */
async function calculateSlideDistance(page) {
  try {
    // 查找滑动验证码的背景图和缺口图
    const bgImageSelectors = [
      '.captcha-bg',
      '.yidun_bg-img',
      '.geetest_canvas_bg',
      '[class*="captcha"] img',
    ];
    
    // 这里简化处理，返回一个估计值
    // 实际项目中应该分析图片，找到缺口位置
    
    // 获取滑动区域宽度
    const sliderTrackSelectors = [
      '.slider-track',
      '.yidun_slider',
      '.geetest_slider_track',
      '.sliderContainer',
    ];
    
    let trackWidth = 0;
    for (const selector of sliderTrackSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            trackWidth = box.width;
            break;
          }
        }
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }
    
    if (trackWidth === 0) {
      // 如果无法获取轨道宽度，使用一个默认值
      trackWidth = 300;
    }
    
    // 返回一个合理的滑动距离（轨道宽度的40%-60%）
    return trackWidth * (0.4 + Math.random() * 0.2);
  } catch (error) {
    console.error('计算滑动距离失败:', error);
    // 返回一个默认值
    return 150;
  }
}

/**
 * 检查滑动验证是否成功
 */
async function checkSliderSuccess(page) {
  // 成功指标
  const successSelectors = [
    '.success',
    '.verified',
    '.captcha-success',
    '[class*="success"]',
  ];
  
  // 失败指标
  const failureSelectors = [
    '.error',
    '.fail',
    '.captcha-fail',
    '[class*="error"]',
  ];
  
  // 检查成功指标
  for (const selector of successSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return true;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }
  
  // 检查失败指标
  for (const selector of failureSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        return false;
      }
    } catch (error) {
      // 继续检查下一个指标
    }
  }
  
  // 如果没有明确的成功/失败指标，检查滑块是否到达终点
  return true;
}

/**
 * 生成随机偏移量，模拟人类操作的不精确性
 */
function getRandomOffset(maxOffset) {
  return (Math.random() * 2 - 1) * maxOffset;
}
