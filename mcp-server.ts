#!/usr/bin/env node

/**
 * 环境管理器 MCP 服务器
 * 提供环境管理、自动登录和调试功能的 AI 接口
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// 工具定义
const TOOLS: Tool[] = [
  {
    name: 'list_environments',
    description: '获取所有环境列表',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_sites',
    description: '获取指定环境的网站列表',
    inputSchema: {
      type: 'object',
      properties: {
        environment: {
          type: 'string',
          description: '环境名称，如果不指定则获取所有网站',
        },
      },
    },
  },
  {
    name: 'create_site',
    description: '创建新的网站配置',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '网站名称' },
        url: { type: 'string', description: '登录页面URL' },
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
        captchaType: { type: 'string', description: '验证码类型：无、图形、滑动、点击、短信' },
        category: { type: 'string', description: '分类/环境' },
        notes: { type: 'string', description: '备注信息' },
      },
      required: ['name', 'url', 'username', 'password'],
    },
  },
  {
    name: 'update_site',
    description: '更新网站配置',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: '网站ID' },
        name: { type: 'string', description: '网站名称' },
        url: { type: 'string', description: '登录页面URL' },
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
        captchaType: { type: 'string', description: '验证码类型' },
        category: { type: 'string', description: '分类/环境' },
        notes: { type: 'string', description: '备注信息' },
        status: { type: 'string', description: '状态：启用、禁用' },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'delete_site',
    description: '删除网站配置（软删除）',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: '网站ID' },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'test_auto_login',
    description: '测试网站自动登录功能',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: '网站ID' },
        mode: { 
          type: 'string', 
          description: '测试模式：debug（调试模式）、enhanced（增强模式）、simple（简单模式）',
          enum: ['debug', 'enhanced', 'simple']
        },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'analyze_login_page',
    description: '分析登录页面结构，提供登录建议',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '登录页面URL' },
        takeScreenshot: { type: 'boolean', description: '是否截图分析' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_login_history',
    description: '获取登录历史记录',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: '网站ID，不指定则获取所有历史' },
        limit: { type: 'number', description: '返回记录数量限制' },
      },
    },
  },
  {
    name: 'optimize_login_strategy',
    description: '基于历史数据优化登录策略',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: '网站ID' },
        analysisType: {
          type: 'string',
          description: '分析类型：success_rate（成功率）、failure_reasons（失败原因）、optimization（优化建议）',
          enum: ['success_rate', 'failure_reasons', 'optimization']
        },
      },
      required: ['siteId'],
    },
  },
  {
    name: 'batch_test_sites',
    description: '批量测试多个网站的登录功能',
    inputSchema: {
      type: 'object',
      properties: {
        environment: { type: 'string', description: '环境名称，测试该环境下的所有网站' },
        siteIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: '网站ID列表，指定要测试的网站'
        },
        mode: { 
          type: 'string', 
          description: '测试模式',
          enum: ['debug', 'enhanced', 'simple']
        },
      },
    },
  },
];

// MCP 服务器实例
const server = new Server(
  {
    name: 'environment-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// API 基础 URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// 工具处理函数
async function callAPI(endpoint: string, method: string = 'GET', data?: any) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`API 调用失败: ${error}`);
  }
}

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_environments':
        const environments = await callAPI('/environments');
        return {
          content: [
            {
              type: 'text',
              text: `环境列表：\n${JSON.stringify(environments, null, 2)}`,
            },
          ],
        };

      case 'list_sites':
        const sitesEndpoint = args?.environment 
          ? `/sites?environment=${encodeURIComponent(args.environment)}`
          : '/sites';
        const sites = await callAPI(sitesEndpoint);
        return {
          content: [
            {
              type: 'text',
              text: `网站列表：\n${JSON.stringify(sites, null, 2)}`,
            },
          ],
        };

      case 'create_site':
        const newSite = await callAPI('/sites', 'POST', args);
        return {
          content: [
            {
              type: 'text',
              text: `网站创建成功：\n${JSON.stringify(newSite, null, 2)}`,
            },
          ],
        };

      case 'update_site':
        const { siteId, ...updateData } = args;
        const updatedSite = await callAPI(`/sites/${siteId}`, 'PUT', updateData);
        return {
          content: [
            {
              type: 'text',
              text: `网站更新成功：\n${JSON.stringify(updatedSite, null, 2)}`,
            },
          ],
        };

      case 'delete_site':
        const deleteResult = await callAPI(`/sites/${args.siteId}`, 'DELETE');
        return {
          content: [
            {
              type: 'text',
              text: `网站删除成功：\n${JSON.stringify(deleteResult, null, 2)}`,
            },
          ],
        };

      case 'test_auto_login':
        const testEndpoint = args.mode === 'debug' 
          ? '/debug-login'
          : args.mode === 'enhanced'
          ? '/enhanced-auto-login'
          : '/simple-auto-login';
        
        const testResult = await callAPI(testEndpoint, 'POST', { siteId: args.siteId });
        return {
          content: [
            {
              type: 'text',
              text: `自动登录测试结果：\n${JSON.stringify(testResult, null, 2)}`,
            },
          ],
        };

      case 'analyze_login_page':
        const analysisResult = await callAPI('/analyze-page', 'POST', {
          url: args.url,
          takeScreenshot: args.takeScreenshot || false,
        });
        return {
          content: [
            {
              type: 'text',
              text: `页面分析结果：\n${JSON.stringify(analysisResult, null, 2)}`,
            },
          ],
        };

      case 'get_login_history':
        const historyEndpoint = args?.siteId 
          ? `/login-history?siteId=${args.siteId}&limit=${args?.limit || 50}`
          : `/login-history?limit=${args?.limit || 50}`;
        const history = await callAPI(historyEndpoint);
        return {
          content: [
            {
              type: 'text',
              text: `登录历史：\n${JSON.stringify(history, null, 2)}`,
            },
          ],
        };

      case 'optimize_login_strategy':
        const optimizationResult = await callAPI('/optimize-strategy', 'POST', {
          siteId: args.siteId,
          analysisType: args.analysisType || 'optimization',
        });
        return {
          content: [
            {
              type: 'text',
              text: `登录策略优化建议：\n${JSON.stringify(optimizationResult, null, 2)}`,
            },
          ],
        };

      case 'batch_test_sites':
        const batchTestResult = await callAPI('/batch-test', 'POST', {
          environment: args.environment,
          siteIds: args.siteIds,
          mode: args.mode || 'enhanced',
        });
        return {
          content: [
            {
              type: 'text',
              text: `批量测试结果：\n${JSON.stringify(batchTestResult, null, 2)}`,
            },
          ],
        };

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('环境管理器 MCP 服务器已启动');
}

main().catch((error) => {
  console.error('MCP 服务器启动失败:', error);
  process.exit(1);
});
