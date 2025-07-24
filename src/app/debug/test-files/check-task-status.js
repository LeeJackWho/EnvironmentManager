/**
 * 检查任务状态和错误信息
 */

async function checkTaskStatus() {
  console.log('🔍 检查任务状态...');
  
  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log('❌ 获取任务状态失败:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 任务状态响应:', JSON.stringify(data, null, 2));
    
    if (data.tasks && data.tasks.length > 0) {
      console.log('\n📋 任务列表:');
      data.tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. 任务 ${task.id}:`);
        console.log(`   网站: ${task.siteName}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   模式: ${task.mode}`);
        console.log(`   进度: ${task.progress}%`);
        console.log(`   消息: ${task.message}`);
        console.log(`   开始时间: ${task.startTime}`);
        if (task.endTime) {
          console.log(`   结束时间: ${task.endTime}`);
        }
        if (task.error) {
          console.log(`   ❌ 错误: ${task.error}`);
        }
        if (task.result) {
          console.log(`   📊 结果: ${JSON.stringify(task.result, null, 4)}`);
        }
      });
      
      // 统计信息
      const stats = data.stats;
      if (stats) {
        console.log('\n📈 统计信息:');
        console.log(`   总任务数: ${stats.total}`);
        console.log(`   运行中: ${stats.running}`);
        console.log(`   已完成: ${stats.completed}`);
        console.log(`   失败: ${stats.failed}`);
        console.log(`   已取消: ${stats.cancelled}`);
      }
      
      // 查找失败的任务
      const failedTasks = data.tasks.filter(task => task.status === 'failed');
      if (failedTasks.length > 0) {
        console.log('\n❌ 失败的任务详情:');
        failedTasks.forEach((task, index) => {
          console.log(`\n失败任务 ${index + 1}:`);
          console.log(`   ID: ${task.id}`);
          console.log(`   网站: ${task.siteName}`);
          console.log(`   模式: ${task.mode}`);
          console.log(`   错误: ${task.error}`);
          console.log(`   消息: ${task.message}`);
          if (task.result) {
            console.log(`   详细结果: ${JSON.stringify(task.result, null, 4)}`);
          }
        });
      }
      
    } else {
      console.log('📭 没有找到任务');
    }
    
  } catch (error) {
    console.error('❌ 检查任务状态失败:', error);
  }
}

// 运行检查
if (require.main === module) {
  checkTaskStatus().catch(console.error);
}
