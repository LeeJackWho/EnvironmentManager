'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiDatabase, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

/**
 * 数据库结构检查页面
 * 用于检查 Notion 数据库字段配置是否正确
 */
export default function DatabaseDebugPage() {
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/check-database');
      const data = await response.json();
      setDatabaseInfo(data);
    } catch (error) {
      console.error('检查数据库失败:', error);
      setDatabaseInfo({
        success: false,
        error: '检查数据库失败',
        details: { message: (error as Error).message }
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <FiCheck className="text-green-500" />
    ) : (
      <FiX className="text-red-500" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiDatabase />
            数据库结构检查
          </h1>
          <p className="text-gray-600 mt-1">检查 Notion 数据库字段配置和结构</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/debug"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiArrowLeft size={16} />
            返回调试工具
          </Link>
          <button
            onClick={checkDatabase}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? '检查中...' : '检查数据库'}
          </button>
        </div>
      </div>

      {/* 必需字段说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">📋 必需的数据库字段</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Name</span>
              <span className="text-blue-600">Title</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">URL</span>
              <span className="text-blue-600">URL</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Username</span>
              <span className="text-blue-600">Text</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Password</span>
              <span className="text-blue-600">Text</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Category</span>
              <span className="text-blue-600">Select</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">CaptchaType</span>
              <span className="text-blue-600">Select</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status</span>
              <span className="text-blue-600">Status</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cookies</span>
              <span className="text-blue-600">Text</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Description</span>
              <span className="text-blue-600">Text</span>
            </div>
          </div>
        </div>
      </div>

      {/* 检查结果 */}
      {databaseInfo && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">检查结果</h2>
          
          {databaseInfo.success ? (
            <div className="space-y-6">
              {/* 数据库基本信息 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FiCheck className="text-green-500" />
                  数据库信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">标题:</span> {databaseInfo.database?.title}
                  </div>
                  <div>
                    <span className="font-medium">字段总数:</span> {databaseInfo.fields?.total}
                  </div>
                  <div>
                    <span className="font-medium">创建时间:</span> {new Date(databaseInfo.database?.created_time).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">最后编辑:</span> {new Date(databaseInfo.database?.last_edited_time).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 字段匹配状态 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3">字段匹配状态</h3>
                <div className="space-y-2">
                  {databaseInfo.fields?.mapping?.map((field: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(field.found)}
                        <span className="font-medium">{field.required}</span>
                        {field.matched && (
                          <span className="text-sm text-gray-600">→ {field.matched.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {field.expectedType}
                        </span>
                        {field.matched && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            field.matched.typeMatch 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {field.matched.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 缺失字段 */}
              {databaseInfo.fields?.missingFields?.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium mb-3 text-red-900">缺失的字段</h3>
                  <div className="space-y-2">
                    {databaseInfo.fields.missingFields.map((field: any, index: number) => (
                      <div key={index} className="text-sm text-red-800">
                        <span className="font-medium">{field.required}</span>
                        <span className="text-red-600"> ({field.expectedType})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 建议 */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium mb-3 text-green-900">建议</h3>
                <p className="text-sm text-green-800">{databaseInfo.suggestions?.message}</p>
              </div>
            </div>
          ) : (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <FiX className="text-red-500" />
                <h3 className="font-medium text-red-900">检查失败</h3>
              </div>
              <p className="text-sm text-red-800">{databaseInfo.error}</p>
              {databaseInfo.details && (
                <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(databaseInfo.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
