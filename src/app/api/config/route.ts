import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG_ITEMS, CONFIG_CATEGORIES, ConfigItem, ConfigUpdateRequest, ConfigValidationResult } from '@/types/config';

/**
 * 配置管理 API
 * 支持获取、更新和验证配置项
 */

const CONFIG_FILE_PATH = path.join(process.cwd(), '.env.local');
const CONFIG_BACKUP_PATH = path.join(process.cwd(), '.env.backup');

/**
 * 获取所有配置项
 */
export async function GET() {
  try {
    console.log('📋 获取配置项...');

    // 读取当前环境变量文件
    const currentConfig = readEnvFile();
    
    // 合并默认配置和当前配置
    const configItems = DEFAULT_CONFIG_ITEMS.map(item => ({
      ...item,
      value: currentConfig[item.id] !== undefined ? parseConfigValue(currentConfig[item.id], item.type) : item.value
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: configItems,
        categories: CONFIG_CATEGORIES,
        lastModified: getFileLastModified(CONFIG_FILE_PATH)
      }
    });

  } catch (error) {
    console.error('❌ 获取配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置失败'
    }, { status: 500 });
  }
}

/**
 * 更新配置项
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('💾 更新配置项...');

    const body = await request.json();
    const updates: ConfigUpdateRequest[] = body.updates;

    if (!Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: '无效的更新数据格式'
      }, { status: 400 });
    }

    // 验证配置项
    const validation = validateConfigUpdates(updates);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: '配置验证失败',
        details: validation.errors
      }, { status: 400 });
    }

    // 备份当前配置
    await backupCurrentConfig();

    // 读取当前配置
    const currentConfig = readEnvFile();

    // 应用更新
    const updatedConfig = { ...currentConfig };
    const changedItems: string[] = [];

    for (const update of updates) {
      const configItem = DEFAULT_CONFIG_ITEMS.find(item => item.id === update.id);
      if (configItem) {
        const newValue = formatConfigValue(update.value, configItem.type);
        if (updatedConfig[update.id] !== newValue) {
          updatedConfig[update.id] = newValue;
          changedItems.push(configItem.name);
        }
      }
    }

    // 写入配置文件
    await writeEnvFile(updatedConfig);

    // 检查是否需要重启
    const restartRequired = updates.some(update => {
      const configItem = DEFAULT_CONFIG_ITEMS.find(item => item.id === update.id);
      return configItem?.restartRequired;
    });

    console.log(`✅ 配置更新完成，共更新 ${changedItems.length} 项配置`);

    return NextResponse.json({
      success: true,
      message: `配置更新成功，共更新 ${changedItems.length} 项配置`,
      data: {
        changedItems,
        restartRequired,
        lastModified: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 更新配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新配置失败'
    }, { status: 500 });
  }
}

/**
 * 重置配置到默认值
 */
export async function DELETE() {
  try {
    console.log('🔄 重置配置到默认值...');

    // 备份当前配置
    await backupCurrentConfig();

    // 创建默认配置
    const defaultConfig: Record<string, string> = {};
    DEFAULT_CONFIG_ITEMS.forEach(item => {
      if (item.defaultValue !== undefined) {
        defaultConfig[item.id] = formatConfigValue(item.defaultValue, item.type);
      }
    });

    // 写入默认配置
    await writeEnvFile(defaultConfig);

    console.log('✅ 配置重置完成');

    return NextResponse.json({
      success: true,
      message: '配置已重置到默认值',
      data: {
        resetItems: Object.keys(defaultConfig),
        restartRequired: true
      }
    });

  } catch (error) {
    console.error('❌ 重置配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '重置配置失败'
    }, { status: 500 });
  }
}

/**
 * 读取环境变量文件
 */
function readEnvFile(): Record<string, string> {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      return {};
    }

    const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const config: Record<string, string> = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return config;
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return {};
  }
}

/**
 * 写入环境变量文件
 */
async function writeEnvFile(config: Record<string, string>): Promise<void> {
  try {
    const lines: string[] = [
      '# 环境管理器配置文件',
      '# 此文件由配置管理功能自动生成和维护',
      `# 最后更新时间: ${new Date().toLocaleString()}`,
      ''
    ];

    // 按分类组织配置项
    CONFIG_CATEGORIES.forEach(category => {
      const categoryItems = DEFAULT_CONFIG_ITEMS.filter(item => item.category === category.id);
      if (categoryItems.length > 0) {
        lines.push(`# ${category.icon} ${category.name}`);
        lines.push(`# ${category.description}`);
        
        categoryItems.forEach(item => {
          if (config[item.id] !== undefined) {
            lines.push(`# ${item.description}`);
            lines.push(`${item.id}=${config[item.id]}`);
            lines.push('');
          }
        });
      }
    });

    fs.writeFileSync(CONFIG_FILE_PATH, lines.join('\n'));
  } catch (error) {
    throw new Error(`写入配置文件失败: ${error}`);
  }
}

/**
 * 备份当前配置
 */
async function backupCurrentConfig(): Promise<void> {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.copyFileSync(CONFIG_FILE_PATH, CONFIG_BACKUP_PATH);
      console.log('✅ 配置文件已备份');
    }
  } catch (error) {
    console.warn('⚠️ 配置文件备份失败:', error);
  }
}

/**
 * 验证配置更新
 */
function validateConfigUpdates(updates: ConfigUpdateRequest[]): ConfigValidationResult {
  const errors: Array<{ id: string; message: string }> = [];

  updates.forEach(update => {
    const configItem = DEFAULT_CONFIG_ITEMS.find(item => item.id === update.id);
    if (!configItem) {
      errors.push({ id: update.id, message: '未知的配置项' });
      return;
    }

    // 必填项验证
    if (configItem.required && (update.value === '' || update.value === null || update.value === undefined)) {
      errors.push({ id: update.id, message: '此配置项为必填项' });
      return;
    }

    // 类型验证
    if (!validateConfigType(update.value, configItem.type)) {
      errors.push({ id: update.id, message: `配置值类型不正确，应为 ${configItem.type}` });
      return;
    }

    // 自定义验证
    if (configItem.validation) {
      const validation = configItem.validation;
      
      if (validation.pattern && typeof update.value === 'string') {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(update.value)) {
          errors.push({ id: update.id, message: validation.message || '配置值格式不正确' });
        }
      }

      if (validation.min !== undefined && typeof update.value === 'number') {
        if (update.value < validation.min) {
          errors.push({ id: update.id, message: `值不能小于 ${validation.min}` });
        }
      }

      if (validation.max !== undefined && typeof update.value === 'number') {
        if (update.value > validation.max) {
          errors.push({ id: update.id, message: `值不能大于 ${validation.max}` });
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证配置值类型
 */
function validateConfigType(value: any, type: string): boolean {
  switch (type) {
    case 'text':
    case 'password':
    case 'textarea':
    case 'select':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}

/**
 * 解析配置值
 */
function parseConfigValue(value: string, type: string): any {
  switch (type) {
    case 'number':
      return parseFloat(value) || 0;
    case 'boolean':
      return value === 'true';
    default:
      return value;
  }
}

/**
 * 格式化配置值
 */
function formatConfigValue(value: any, type: string): string {
  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return String(value);
    default:
      return String(value);
  }
}

/**
 * 获取文件最后修改时间
 */
function getFileLastModified(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.mtime.toISOString();
    }
    return null;
  } catch (error) {
    return null;
  }
}
