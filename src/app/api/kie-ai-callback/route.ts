import { NextRequest, NextResponse } from 'next/server';
import { downloadAndSaveImage, taskStorage, TaskStatus, TaskData, StickerStyle } from '../image-to-sticker-ai/route';
import fs from 'fs/promises';
import path from 'path';

// Task backup helpers
const TASKS_BACKUP_FILE = path.join(process.cwd(), '.tasks-backup.json');

async function saveTaskBackup(taskId: string, task: any): Promise<void> {
  try {
    let backupData: Record<string, any> = {};

    try {
      const existing = await fs.readFile(TASKS_BACKUP_FILE, 'utf-8');
      backupData = JSON.parse(existing);
    } catch (error) {
      // 文件不存在或损坏，使用空对象
    }

    backupData[taskId] = {
      ...task,
      createdAt: task.createdAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };

    await fs.writeFile(TASKS_BACKUP_FILE, JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.warn('⚠️ Failed to save task backup in callback:', error);
  }
}

/**
 * KIE AI 回调端点
 * 当KIE AI完成图片生成后，会POST结果到这个端点
 *
 * 优势：每次生成只需要1次API调用，不需要轮询
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse callback data from KIE AI
    const callbackData = await req.json();

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

      // 【新增】即使没有本地任务，也处理成功的结果
      if (code === 200 && info?.result_urls && info.result_urls.length > 0) {
        console.log('🔄 本地任务不存在，但KIE AI生成成功，执行备用处理...');

        try {
          // 限制只处理第一张图片
          const limitedUrls = info.result_urls.slice(0, 1);
          console.log(`📸 收到 ${info.result_urls.length} 张生成图片，处理 ${limitedUrls.length} 张 (成本优化)`);

          // 下载并保存到R2
          const remoteUrl = limitedUrls[0];
          const filename = `kie-fallback-${taskId}-${Date.now()}.png`;

          const localUrl = await downloadAndSaveImage(remoteUrl, filename);
          console.log(`✅ 备用处理成功，图片已保存到R2: ${localUrl}`);

                    // 【关键修复】寻找对应的本地任务并更新状态
          // 通过遍历所有任务，找到kieTaskId匹配的任务
          console.log(`🔍 [DEBUG] 开始查找KIE任务ID ${taskId} 对应的本地任务...`);
          console.log(`🔍 [DEBUG] 当前taskStorage中有 ${taskStorage.size} 个任务`);

          let foundLocalTask = false;
          for (const [localTaskId, task] of taskStorage.entries()) {
            console.log(`🔍 [DEBUG] 检查任务 ${localTaskId}, kieTaskId: ${task.kieTaskId}`);
            if (task.kieTaskId === taskId) {
              // 找到了！更新任务状态
              console.log(`✅ [DEBUG] 找到匹配的本地任务！更新状态...`);
              task.status = TaskStatus.COMPLETED;
              task.completedAt = new Date();
              task.resultUrls = [localUrl];
              task.error = undefined;

              taskStorage.set(localTaskId, task);
              saveTaskBackup(localTaskId, task).catch(console.warn);

              console.log(`🔄 [FALLBACK FIX] 已更新本地任务 ${localTaskId} 状态为completed`);
              console.log(`🔄 [FALLBACK FIX] 任务结果URL: ${localUrl}`);
              foundLocalTask = true;
              break;
            }
          }

          console.log(`🔍 [DEBUG] 查找结果: foundLocalTask = ${foundLocalTask}`);

                    if (!foundLocalTask) {
            // 如果还是找不到本地任务，创建一个临时任务记录供前端查询
            const tempTaskId = `fallback-${taskId}`;
            const tempTask: TaskData = {
              taskId: tempTaskId,
              kieTaskId: taskId,
              status: TaskStatus.COMPLETED,
              resultUrls: [localUrl],
              createdAt: new Date(),
              completedAt: new Date(),
              style: 'ios' as StickerStyle,
              prompt: 'Generated via fallback mechanism',
              size: '1:1',
              nVariants: 1,
              userId: 'fallback-user'
            };

            taskStorage.set(tempTaskId, tempTask);
            saveTaskBackup(tempTaskId, tempTask).catch(console.warn);
            console.log(`🆘 [FALLBACK TEMP] 创建临时任务记录 ${tempTaskId} 供查询`);
          }

          // 记录到日志便于用户查找
          console.log(`🎯 [FALLBACK SUCCESS] KIE任务 ${taskId} 的结果已保存，用户可通过R2 URL访问: ${localUrl}`);

        } catch (error) {
          console.error(`❌ 备用处理失败:`, error);
        }
      }

      // 返回成功避免KIE AI重试
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

        // 【新增】备份任务到文件
        saveTaskBackup(localTask.taskId, localTask).catch(console.warn);

        console.log(`🎉 任务 ${localTask.taskId} 完成，保存了 ${localImageUrls.length} 张图片`);

        // TODO: 这里可以添加WebSocket或SSE通知前端
        // notifyFrontend(localTask.taskId, 'completed', localImageUrls);

      } else {
        console.log(`⚠️ 任务完成但没有收到图片URL`);
        localTask.status = TaskStatus.FAILED;
        localTask.error = 'Task completed but no images received';
        localTask.completedAt = new Date();
        taskStorage.set(localTask.taskId, localTask);

        // 【新增】备份任务到文件
        saveTaskBackup(localTask.taskId, localTask).catch(console.warn);
      }

    } else {
      // 失败情况
      console.log(`❌ KIE AI 任务 ${taskId} 失败: ${msg}`);

      localTask.status = TaskStatus.FAILED;
      localTask.error = `KIE AI callback error: ${msg}`;
      localTask.completedAt = new Date();
      taskStorage.set(localTask.taskId, localTask);

      // 【新增】备份任务到文件
      saveTaskBackup(localTask.taskId, localTask).catch(console.warn);

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
