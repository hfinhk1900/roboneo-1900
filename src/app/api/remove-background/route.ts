import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { image_input } = await request.json();

    if (!image_input) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      );
    }

    // 生成临时文件名
    const tempId = uuidv4();
    const tempDir = path.join(process.cwd(), 'temp');
    const inputPath = path.join(tempDir, `input_${tempId}.png`);
    const outputPath = path.join(tempDir, `output_${tempId}.png`);

    try {
      // 确保临时目录存在
      await fs.mkdir(tempDir, { recursive: true });

      // 将 base64 图片保存为文件
      const base64Data = image_input.replace(/^data:image\/[a-z]+;base64,/, '');
      await fs.writeFile(inputPath, base64Data, 'base64');

            // 执行去背景处理
      const scriptPath = path.join(process.cwd(), 'scripts', 'background_removal_service.py');
      const pythonEnv = path.join(process.cwd(), 'bg_removal_env', 'bin', 'python');

      const command = `"${pythonEnv}" "${scriptPath}" -i "${inputPath}" -o "${outputPath}"`;

      console.log('🎯 执行去背景命令:', command);

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('warning')) {
        throw new Error(`去背景处理失败: ${stderr}`);
      }

      // 读取处理后的图片
      const outputBuffer = await fs.readFile(outputPath);
      const resultBase64 = `data:image/png;base64,${outputBuffer.toString('base64')}`;

      // 清理临时文件
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {})
      ]);

      return NextResponse.json({
        success: true,
        image: resultBase64,
        message: '背景去除成功'
      });

    } catch (error) {
      // 清理临时文件
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {})
      ]);

      throw error;
    }

  } catch (error) {
    console.error('❌ 去背景API错误:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '去背景处理失败',
        success: false
      },
      { status: 500 }
    );
  }
}
