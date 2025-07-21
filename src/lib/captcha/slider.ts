import { Page } from 'playwright-core';

export interface SliderResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 滑动验证码解决方案
 * 支持多种常见的滑动验证码类型
 */
export async function solveSliderCaptcha(page: Page): Promise<SliderResult> {
  try {
    console.log('🎯 开始处理滑动验证码...');

    // 尝试不同类型的滑动验证码
    const solvers = [
      () => solveStandardSlider(page),
      () => solvePuzzleSlider(page),
      () => solveGeetestSlider(page),
      () => solveCustomSlider(page),
    ];

    for (const solver of solvers) {
      try {
        const result = await solver();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log(`滑动验证码解决方案失败，尝试下一个...`);
        continue;
      }
    }

    return {
      success: false,
      message: '所有滑动验证码解决方案都失败了',
    };

  } catch (error) {
    console.error('滑动验证码处理失败:', error);
    return {
      success: false,
      message: '滑动验证码处理异常',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 标准滑动验证码处理
 */
async function solveStandardSlider(page: Page): Promise<SliderResult> {
  const sliderSelectors = [
    '.slider-button',
    '.slide-btn',
    '.slider-handle',
    '.drag-btn',
    '.captcha-slider',
    '[class*="slider"]',
    '[class*="slide"]',
    '[class*="drag"]',
  ];

  const trackSelectors = [
    '.slider-track',
    '.slide-track',
    '.slider-bg',
    '.captcha-track',
    '[class*="track"]',
  ];

  // 查找滑块和轨道
  let slider = null;
  let track = null;

  for (const selector of sliderSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        slider = element;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  for (const selector of trackSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        track = element;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!slider) {
    throw new Error('未找到滑块元素');
  }

  // 获取滑块和轨道的位置信息
  const sliderBox = await slider.boundingBox();
  const trackBox = track ? await track.boundingBox() : null;

  if (!sliderBox) {
    throw new Error('无法获取滑块位置');
  }

  // 计算滑动距离
  let slideDistance = 200; // 默认滑动距离
  if (trackBox) {
    slideDistance = trackBox.width - sliderBox.width;
  }

  // 执行滑动操作
  await performSlide(page, slider, slideDistance);

  // 等待验证结果
  await page.waitForTimeout(2000);

  // 检查是否成功
  const isSuccess = await checkSliderSuccess(page);

  return {
    success: isSuccess,
    message: isSuccess ? '标准滑动验证码解决成功' : '标准滑动验证码解决失败',
  };
}

/**
 * 拼图滑动验证码处理
 */
async function solvePuzzleSlider(page: Page): Promise<SliderResult> {
  const puzzleSelectors = [
    '.puzzle-slider',
    '.jigsaw-slider',
    '.captcha-puzzle',
    '[class*="puzzle"]',
    '[class*="jigsaw"]',
  ];

  let puzzleSlider = null;

  for (const selector of puzzleSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        puzzleSlider = element;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!puzzleSlider) {
    throw new Error('未找到拼图滑块');
  }

  // 拼图验证码通常需要精确的位置计算
  // 这里使用简化的方法
  const slideDistance = await calculatePuzzleDistance(page);
  await performSlide(page, puzzleSlider, slideDistance);

  await page.waitForTimeout(2000);
  const isSuccess = await checkSliderSuccess(page);

  return {
    success: isSuccess,
    message: isSuccess ? '拼图滑动验证码解决成功' : '拼图滑动验证码解决失败',
  };
}

/**
 * 极验滑动验证码处理
 */
async function solveGeetestSlider(page: Page): Promise<SliderResult> {
  const geetestSelectors = [
    '.geetest_slider_button',
    '.gt_slider_knob',
    '.geetest-slider',
    '[class*="geetest"]',
  ];

  let geetestSlider = null;

  for (const selector of geetestSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        geetestSlider = element;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!geetestSlider) {
    throw new Error('未找到极验滑块');
  }

  // 极验验证码的特殊处理
  const slideDistance = 200; // 极验通常需要滑动到最右端
  await performSlide(page, geetestSlider, slideDistance, true);

  await page.waitForTimeout(3000); // 极验需要更长的等待时间
  const isSuccess = await checkSliderSuccess(page);

  return {
    success: isSuccess,
    message: isSuccess ? '极验滑动验证码解决成功' : '极验滑动验证码解决失败',
  };
}

/**
 * 自定义滑动验证码处理
 */
async function solveCustomSlider(page: Page): Promise<SliderResult> {
  // 通用的滑块查找策略
  const allElements = await page.locator('*').all();
  
  for (const element of allElements) {
    try {
      if (await element.isVisible()) {
        const className = await element.getAttribute('class') || '';
        const id = await element.getAttribute('id') || '';
        const style = await element.getAttribute('style') || '';
        
        // 检查是否可能是滑块
        const isPossibleSlider = (
          className.toLowerCase().includes('slide') ||
          className.toLowerCase().includes('drag') ||
          className.toLowerCase().includes('button') ||
          id.toLowerCase().includes('slide') ||
          style.includes('cursor: pointer') ||
          style.includes('cursor:pointer')
        );
        
        if (isPossibleSlider) {
          const box = await element.boundingBox();
          if (box && box.width > 20 && box.width < 100 && box.height > 20 && box.height < 100) {
            // 尝试滑动这个元素
            await performSlide(page, element, 200);
            await page.waitForTimeout(2000);
            
            const isSuccess = await checkSliderSuccess(page);
            if (isSuccess) {
              return {
                success: true,
                message: '自定义滑动验证码解决成功',
              };
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error('未找到可用的滑块元素');
}

/**
 * 执行滑动操作
 */
async function performSlide(page: Page, slider: any, distance: number, isGeetest: boolean = false): Promise<void> {
  const sliderBox = await slider.boundingBox();
  if (!sliderBox) {
    throw new Error('无法获取滑块位置');
  }

  const startX = sliderBox.x + sliderBox.width / 2;
  const startY = sliderBox.y + sliderBox.height / 2;
  const endX = startX + distance;

  if (isGeetest) {
    // 极验验证码需要更复杂的滑动轨迹
    await performGeetestSlide(page, startX, startY, endX);
  } else {
    // 标准滑动
    await performStandardSlide(page, startX, startY, endX);
  }
}

/**
 * 标准滑动操作
 */
async function performStandardSlide(page: Page, startX: number, startY: number, endX: number): Promise<void> {
  // 模拟人类滑动行为
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  
  // 分段滑动，模拟真实用户行为
  const steps = 10;
  const stepDistance = (endX - startX) / steps;
  
  for (let i = 1; i <= steps; i++) {
    const currentX = startX + stepDistance * i;
    await page.mouse.move(currentX, startY, { steps: 3 });
    await page.waitForTimeout(50 + Math.random() * 50); // 随机延迟
  }
  
  await page.mouse.up();
}

/**
 * 极验滑动操作（更复杂的轨迹）
 */
async function performGeetestSlide(page: Page, startX: number, startY: number, endX: number): Promise<void> {
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  
  // 极验需要更复杂的轨迹来避免检测
  const distance = endX - startX;
  const steps = 20;
  
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    
    // 使用缓动函数模拟真实滑动
    const easeProgress = easeOutCubic(progress);
    const currentX = startX + distance * easeProgress;
    
    // 添加轻微的Y轴抖动
    const yOffset = Math.sin(progress * Math.PI * 4) * 2;
    const currentY = startY + yOffset;
    
    await page.mouse.move(currentX, currentY, { steps: 2 });
    await page.waitForTimeout(30 + Math.random() * 40);
  }
  
  await page.mouse.up();
}

/**
 * 缓动函数
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 计算拼图滑动距离
 */
async function calculatePuzzleDistance(page: Page): Promise<number> {
  // 这里应该实现图像识别来计算拼图的缺口位置
  // 简化实现，返回固定值
  return 150;
}

/**
 * 检查滑动验证码是否成功
 */
async function checkSliderSuccess(page: Page): Promise<boolean> {
  const successSelectors = [
    '.slider-success',
    '.captcha-success',
    '.verify-success',
    ':text("验证成功")',
    ':text("验证通过")',
    ':text("Success")',
    '[class*="success"]',
  ];

  for (const selector of successSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  // 检查是否还有滑块存在（成功后滑块通常会消失）
  const sliderSelectors = [
    '.slider-button',
    '.slide-btn',
    '.captcha-slider',
  ];

  for (const selector of sliderSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        return false; // 滑块还在，说明验证失败
      }
    } catch (error) {
      continue;
    }
  }

  // 如果滑块消失了，可能验证成功
  return true;
}
