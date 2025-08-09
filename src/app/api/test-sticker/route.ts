/**
 * Test API for KIE AI Sticker Generation
 * This is a simplified version for testing without authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Mock task storage
const mockTasks = new Map<string, any>();

// Mock style images
const MOCK_IMAGES = {
  ios: 'https://placehold.co/1024x1024/9333ea/ffffff/png?text=iOS+Style+✨',
  pixel: 'https://placehold.co/1024x1024/16a34a/ffffff/png?text=Pixel+Art+🎮',
  lego: 'https://placehold.co/1024x1024/dc2626/ffffff/png?text=LEGO+Style+🧱',
  snoopy: 'https://placehold.co/1024x1024/2563eb/ffffff/png?text=Snoopy+Style+🐕',
  default: 'https://placehold.co/1024x1024/6b7280/ffffff/png?text=AI+Sticker+🎨',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style = 'default' } = body;

    // Create mock task
    const taskId = `test_${nanoid(10)}`;
    const mockTask = {
      taskId,
      status: 'processing',
      progress: 0,
      style,
      prompt,
      createdAt: Date.now(),
    };

    mockTasks.set(taskId, mockTask);

    // Simulate async processing
    setTimeout(() => {
      const task = mockTasks.get(taskId);
      if (task) {
        // Simulate progress updates
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20 + Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            task.status = 'completed';
            task.resultUrl = MOCK_IMAGES[style] || MOCK_IMAGES.default;
          }
          task.progress = Math.min(progress, 100);
          mockTasks.set(taskId, task);
        }, 1000);
      }
    }, 100);

    console.log(`🧪 [TEST API] Created task: ${taskId}, style: ${style}`);

    return NextResponse.json({
      code: 200,
      msg: 'Task created',
      data: { taskId },
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { code: 500, msg: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { code: 400, msg: 'Task ID required' },
        { status: 400 }
      );
    }

    const task = mockTasks.get(taskId);

    if (!task) {
      return NextResponse.json(
        { code: 404, msg: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`🧪 [TEST API] Polling task: ${taskId}, status: ${task.status}, progress: ${task.progress}%`);

    return NextResponse.json({
      code: 200,
      data: {
        status: task.status,
        progress: task.progress,
        resultUrl: task.resultUrl,
      },
    });
  } catch (error) {
    console.error('Test API GET error:', error);
    return NextResponse.json(
      { code: 500, msg: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
