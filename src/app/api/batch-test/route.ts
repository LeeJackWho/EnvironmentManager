import { NextRequest, NextResponse } from 'next/server';

/**
 * 批量测试 API
 * 批量测试多个网站的登录功能
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始批量测试...');

    const body = await request.json();
    const { environment, siteIds, mode = 'enhanced' } = body;

    if (!environment && !siteIds) {
      return NextResponse.json({
        success: false,
        error: '必须指定 environment 或 siteIds 参数'
      }, { status: 400 });
    }

    // 获取要测试的网站列表
    let sitesToTest = [];
    
    if (siteIds) {
      // 根据 siteIds 获取网站
      for (const siteId of siteIds) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sites/${siteId}`);
          if (response.ok) {
            const site = await response.json();
            sitesToTest.push(site);
          }
        } catch (error) {
          console.error(`获取网站 ${siteId} 失败:`, error);
        }
      }
    } else if (environment) {
      // 根据环境获取网站
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sites?environment=${encodeURIComponent(environment)}`);
        if (response.ok) {
          const sites = await response.json();
          sitesToTest = sites.data || sites;
        }
      } catch (error) {
        console.error(`获取环境 ${environment} 的网站失败:`, error);
      }
    }

    if (sitesToTest.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到要测试的网站'
      }, { status: 404 });
    }

    console.log(`📋 准备测试 ${sitesToTest.length} 个网站`);

    // 批量测试结果
    const batchResults = {
      batchId: `batch_${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode,
      totalSites: sitesToTest.length,
      results: [] as any[],
      summary: {
        successful: 0,
        failed: 0,
        partial: 0
      }
    };

    // 逐个测试网站
    for (let i = 0; i < sitesToTest.length; i++) {
      const site = sitesToTest[i];
      console.log(`🧪 测试网站 ${i + 1}/${sitesToTest.length}: ${site.name}`);

      try {
        // 选择测试 API
        const testEndpoint = mode === 'debug' 
          ? '/api/debug-login'
          : mode === 'enhanced'
          ? '/api/enhanced-auto-login'
          : '/api/simple-auto-login';

        // 调用测试 API
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${testEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: site.name,
            url: site.url,
            username: site.username,
            password: site.password,
            captchaType: site.captchaType || '无',
            notes: `批量测试 - ${site.name}`
          }),
        });

        const testResult = await testResponse.json();

        // 分析测试结果
        let status = 'failed';
        if (testResult.success) {
          if (testResult.data?.loginResult?.success) {
            status = 'successful';
            batchResults.summary.successful++;
          } else if (testResult.data?.loginResult?.usernameFilled || testResult.data?.loginResult?.passwordFilled) {
            status = 'partial';
            batchResults.summary.partial++;
          } else {
            batchResults.summary.failed++;
          }
        } else {
          batchResults.summary.failed++;
        }

        // 添加到结果
        batchResults.results.push({
          siteId: site.id,
          siteName: site.name,
          url: site.url,
          status,
          testResult,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ 网站 ${site.name} 测试完成: ${status}`);

        // 添加延迟避免过快请求
        if (i < sitesToTest.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ 网站 ${site.name} 测试失败:`, error);
        
        batchResults.results.push({
          siteId: site.id,
          siteName: site.name,
          url: site.url,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        
        batchResults.summary.failed++;
      }
    }

    // 生成批量测试报告
    const report = generateBatchReport(batchResults);

    console.log(`🎉 批量测试完成: ${batchResults.summary.successful} 成功, ${batchResults.summary.partial} 部分成功, ${batchResults.summary.failed} 失败`);

    return NextResponse.json({
      success: true,
      message: '批量测试完成',
      data: {
        ...batchResults,
        report
      }
    });

  } catch (error) {
    console.error('❌ 批量测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '批量测试失败'
    }, { status: 500 });
  }
}

/**
 * 生成批量测试报告
 */
function generateBatchReport(batchResults: any) {
  const { totalSites, summary, results } = batchResults;
  
  const successRate = totalSites > 0 ? (summary.successful / totalSites * 100).toFixed(1) : '0';
  
  const report = {
    overview: {
      totalSites,
      successRate: `${successRate}%`,
      summary
    },
    recommendations: [] as string[],
    failedSites: results.filter((r: any) => r.status === 'failed' || r.status === 'error'),
    partialSites: results.filter((r: any) => r.status === 'partial'),
    successfulSites: results.filter((r: any) => r.status === 'successful')
  };

  // 生成建议
  if (summary.failed > summary.successful) {
    report.recommendations.push('失败率较高，建议检查网站配置和选择器');
  }
  
  if (summary.partial > 0) {
    report.recommendations.push('部分网站登录不完整，可能需要处理验证码或优化选择器');
  }
  
  if (report.failedSites.length > 0) {
    report.recommendations.push('建议对失败的网站进行单独调试分析');
  }
  
  if (parseFloat(successRate) > 80) {
    report.recommendations.push('整体成功率良好，可以考虑部署到生产环境');
  }

  return report;
}
