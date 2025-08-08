import { NextRequest, NextResponse } from 'next/server';
import { downloadAndSaveImage, taskStorage, TaskStatus } from '../image-to-sticker-ai/route';

/**
 * KIE AI 回调端点
 * 当KIE AI完成图片生成后，会POST结果到这个端点
 *
 * 优势：每次生成只需要1次API调用，不需要轮询
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('📞 收到 KIE AI 回调通知');

    // 解析回调数据
    const callbackData = await req.json();
    console.log('📋 回调数据:', JSON.stringify(callbackData, null, 2));

    const { code, msg, data } = callbackData;
    const { taskId, info } = data || {};

    if (!taskId) {
      console.error('❌ 回调数据中缺少 taskId');
      return NextResponse.json({ error: 'Missing taskId in callback data' }, { status: 400 });
    }

    // 查找对应的本地任务
    const localTask = findTaskByKieId(taskId);
    if (!localTask) {
      console.log(`⚠️ 未找到对应的本地任务: ${taskId}`);
      // 可能是之前的任务，返回成功避免KIE AI重试
      return NextResponse.json({ success: true });
    }

    console.log(`🔍 找到本地任务: ${localTask.taskId}`);

    // 处理回调结果
    if (code === 200) {
      // 成功完成
      console.log(`✅ KIE AI 任务 ${taskId} 完成成功`);

      if (info?.result_urls && info.result_urls.length > 0) {
        // 限制只处理第一张图片，确保成本和体验一致性
        const limitedUrls = info.result_urls.slice(0, 1);
        console.log(`📸 收到 ${info.result_urls.length} 张生成图片，处理 ${limitedUrls.length} 张 (成本优化)`);

        if (info.result_urls.length > 1) {
          console.log(`🎨 [IMAGE LIMIT] KIE AI返回了${info.result_urls.length}张图片，只使用第一张确保一致性`);
        }

        // 下载并保存图片
        const localImageUrls: string[] = [];
        for (let i = 0; i < limitedUrls.length; i++) {
          const remoteUrl = limitedUrls[i];
          const filename = `kie-callback-${Date.now()}-${i + 1}.png`;

          try {
            const localUrl = await downloadAndSaveImage(remoteUrl, filename);
            localImageUrls.push(localUrl);
            console.log(`✅ 图片 ${i + 1} 下载成功: ${localUrl}`);

            // 添加延迟避免过载
            if (i < limitedUrls.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (downloadError) {
            console.error(`❌ 图片 ${i + 1} 下载失败:`, downloadError);
          }
        }

        // 更新任务状态
        localTask.status = TaskStatus.COMPLETED;
        localTask.completedAt = new Date();
        localTask.resultUrls = localImageUrls;
        localTask.error = undefined;

        taskStorage.set(localTask.taskId, localTask);

        console.log(`🎉 任务 ${localTask.taskId} 完成，保存了 ${localImageUrls.length} 张图片`);

        // TODO: 这里可以添加WebSocket或SSE通知前端
        // notifyFrontend(localTask.taskId, 'completed', localImageUrls);

      } else {
        console.log(`⚠️ 任务完成但没有收到图片URL`);
        localTask.status = TaskStatus.FAILED;
        localTask.error = 'Task completed but no images received';
        localTask.completedAt = new Date();
        taskStorage.set(localTask.taskId, localTask);
      }

    } else {
      // 失败情况
      console.log(`❌ KIE AI 任务 ${taskId} 失败: ${msg}`);

      localTask.status = TaskStatus.FAILED;
      localTask.error = `KIE AI callback error: ${msg}`;
      localTask.completedAt = new Date();
      taskStorage.set(localTask.taskId, localTask);

      // TODO: 通知前端任务失败
      // notifyFrontend(localTask.taskId, 'failed', null, msg);
    }

    // 向KIE AI返回成功确认
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ 处理 KIE AI 回调时出错:', error);

    // 即使出错也返回成功，避免KIE AI无限重试
    return NextResponse.json({ success: true });
  }
}

/**
 * 根据KIE AI任务ID查找对应的本地任务
 */
function findTaskByKieId(kieTaskId: string) {
  for (const [localTaskId, task] of taskStorage.entries()) {
    // 检查任务是否包含这个KIE AI任务ID的记录
    // 这需要我们在创建任务时保存KIE AI的任务ID
    if (task.kieTaskId === kieTaskId) {
      return task;
    }
  }
  return null;
}

/**
 * GET 方法用于健康检查
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'KIE AI callback endpoint is ready',
    timestamp: new Date().toISOString()
  });
}
