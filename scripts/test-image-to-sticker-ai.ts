/**
 * Test script for the new image-to-sticker-ai API
 *
 * Prerequisites:
 * 1. Set up environment variables in .env.local:
 *    - KIE_AI_API_KEY="your-kie-ai-api-key"
 *    - KIE_AI_BASE_URL="https://api.kie.ai" (optional)
 * 2. Make sure the development server is running
 *
 * Usage: npx tsx scripts/test-image-to-sticker-ai.ts
 */

const BASE_URL = 'http://localhost:3000';

// Mock bearer token (in real usage, this would be a valid API key)
const BEARER_TOKEN = 'test-token';

interface TaskResponse {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    status?: string;
    resultUrls?: string[];
    error?: string;
    createdAt?: string;
    completedAt?: string;
  };
}

/**
 * Test retrieving available styles
 */
async function testGetStyles(): Promise<void> {
  try {
    console.log('🎨 Testing styles retrieval...');

    const response = await fetch(`${BASE_URL}/api/image-to-sticker-ai?styles=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });

    const result = await response.json();

    if (result.code === 200) {
      console.log('✅ Styles retrieved successfully');
      console.log('📋 Available styles:');
      result.data.styles.forEach((style: any) => {
        console.log(`   - ${style.id}: ${style.name}`);
        console.log(`     Image: ${style.imageUrl}`);
        console.log(`     Description: ${style.description}\n`);
      });
    } else {
      console.log('❌ Failed to retrieve styles:', result.msg);
    }
  } catch (error) {
    console.error('❌ Error retrieving styles:', error);
  }
}

/**
 * Test creating a new sticker generation task
 */
async function testCreateTask() {
  console.log('🧪 Testing task creation...');

  // Cost-optimized request with iOS style (API will enforce optimal settings)
  const requestBody = {
    filesUrl: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    ],
    style: "ios",       // Use iOS sticker style
    size: "1:1",        // Only option available in test mode
    nVariants: 1,       // Only option available in test mode
    isEnhance: false,   // Forced to false for cost optimization
    enableFallback: false, // Forced to false for cost optimization
    fallbackModel: "FLUX_MAX" // Forced to FLUX_MAX for cost optimization
  };

  try {
    const response = await fetch(`${BASE_URL}/api/image-to-sticker-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    const data: TaskResponse = await response.json();
    console.log('📄 Response:', JSON.stringify(data, null, 2));

    if (data.code === 200 && data.data?.taskId) {
      console.log(`✅ Task created successfully: ${data.data.taskId}`);
      return data.data.taskId;
    } else {
      console.log(`❌ Task creation failed: ${data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

/**
 * Test checking task status
 */
async function testCheckStatus(taskId: string) {
  console.log(`🔍 Checking status for task: ${taskId}`);

  try {
    const response = await fetch(`${BASE_URL}/api/image-to-sticker-ai?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });

    const data: TaskResponse = await response.json();
    console.log('📄 Status Response:', JSON.stringify(data, null, 2));

    if (data.code === 200) {
      console.log(`✅ Status: ${data.data?.status}`);
      if (data.data?.resultUrls) {
        console.log(`🖼️  Generated ${data.data.resultUrls.length} images:`);
        data.data.resultUrls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });
      }
    } else {
      console.log(`❌ Status check failed: ${data.msg}`);
    }
  } catch (error) {
    console.error('❌ Status check request failed:', error);
  }
}

/**
 * Test polling task until completion
 */
async function pollTaskCompletion(taskId: string, maxAttempts = 10) {
  console.log(`⏳ Polling task ${taskId} for completion...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📡 Attempt ${attempt}/${maxAttempts}`);

    try {
      const response = await fetch(`${BASE_URL}/api/image-to-sticker-ai?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`
        }
      });

      const data: TaskResponse = await response.json();

      if (data.code === 200 && data.data?.status) {
        const status = data.data.status;
        console.log(`📊 Status: ${status}`);

        if (status === 'completed') {
          console.log('🎉 Task completed successfully!');
          if (data.data.resultUrls) {
            console.log(`🖼️  Generated ${data.data.resultUrls.length} images:`);
            data.data.resultUrls.forEach((url, index) => {
              console.log(`   ${index + 1}. ${url}`);
            });
          }
          return;
        } else if (status === 'failed') {
          console.log(`❌ Task failed: ${data.data.error}`);
          return;
        } else if (status === 'processing' || status === 'pending') {
          console.log('⏳ Task still in progress, waiting...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      } else {
        console.log(`❌ Error checking status: ${data.msg}`);
        return;
      }
    } catch (error) {
      console.error(`❌ Polling attempt ${attempt} failed:`, error);
    }
  }

  console.log(`⏰ Timeout: Task not completed after ${maxAttempts} attempts`);
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting image-to-sticker-ai API tests\n');

  // Test 0: Get available styles
  await testGetStyles();

  console.log('\n---\n');

  // Test 1: Create a task
  const taskId = await testCreateTask();
  if (!taskId) {
    console.log('❌ Cannot continue tests without a valid task ID');
    return;
  }

  console.log('\n---\n');

  // Test 2: Check initial status
  await testCheckStatus(taskId);

  console.log('\n---\n');

  // Test 3: Poll for completion
  await pollTaskCompletion(taskId);

  console.log('\n✅ All tests completed!');
}

/**
 * Test different parameter combinations
 */
async function testParameterVariations() {
  console.log('🔬 Testing different parameter combinations...\n');

    // All test cases are optimized for lowest cost (API enforces these settings)
  const testCases = [
    {
      name: 'iOS Style Sticker',
      request: {
        filesUrl: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
        ],
        style: "ios",      // iOS emoji style
        size: "1:1"        // API will enforce this anyway
      }
    },
    {
      name: 'Pixel Art Style',
      request: {
        filesUrl: [
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop"
        ],
        style: "pixel",    // Retro pixel art style
        size: "1:1"        // API will enforce this
      }
    },
    {
      name: 'LEGO Style',
      request: {
        filesUrl: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"],
        style: "lego",     // LEGO minifigure style
        size: "1:1"        // Forced by API
      }
    },
    {
      name: 'Snoopy Style',
      request: {
        filesUrl: ["https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop"],
        style: "snoopy",   // Peanuts comic style
        size: "1:1"        // Forced by API
      }
    },
    {
      name: 'Custom Prompt (no style)',
      request: {
        prompt: "Transform into a cute cartoon sticker with transparent background",
        filesUrl: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"],
        size: "1:1"        // Forced by API
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);

    try {
      const response = await fetch(`${BASE_URL}/api/image-to-sticker-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`
        },
        body: JSON.stringify(testCase.request)
      });

      const data: TaskResponse = await response.json();
      console.log(`   📄 Response Code: ${data.code}`);
      console.log(`   📝 Message: ${data.msg}`);

      if (data.data?.taskId) {
        console.log(`   🆔 Task ID: ${data.data.taskId}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('');
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

export { testCreateTask, testCheckStatus, pollTaskCompletion, testParameterVariations };
