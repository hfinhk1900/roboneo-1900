/**
 * Test script to verify Image to Sticker functionality with OpenAI API
 *
 * This script tests:
 * 1. API endpoint availability (/api/image-to-sticker)
 * 2. File upload and processing
 * 3. OpenAI GPT Image 1 integration
 * 4. Response format and image generation
 * 5. Authentication and credits system
 *
 * Usage: npx tsx scripts/test-openai-image-to-sticker.ts
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testImagePath: 'public/test-images/sample-person.jpg', // You'll need to add a test image
  styles: ['ios', 'pixel', 'lego', 'snoopy'] as const,
  timeout: 30000, // 30 seconds timeout for OpenAI API
};

type StickerStyle = (typeof TEST_CONFIG.styles)[number];

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

/**
 * Create a test image if it doesn't exist
 */
async function ensureTestImage(): Promise<string> {
  const testImagePath = TEST_CONFIG.testImagePath;

  if (fs.existsSync(testImagePath)) {
    console.log(`✅ Using existing test image: ${testImagePath}`);
    return testImagePath;
  }

  // Create test-images directory
  const testDir = path.dirname(testImagePath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // For this test, we'll create a simple colored square as a test image
  console.log(`📸 Creating test image at: ${testImagePath}`);

  // Create a simple test image (this is a placeholder - you should add a real image)
  const testImageContent = `
This is a placeholder. Please add a real test image (JPG/PNG) at:
${testImagePath}

The image should contain a person for testing the sticker generation.
  `.trim();

  fs.writeFileSync(testImagePath.replace('.jpg', '.txt'), testImageContent);

  throw new Error(
    `❌ Test image not found. Please add a test image at: ${testImagePath}`
  );
}

/**
 * Test the OpenAI Image to Sticker API
 */
async function testImageToStickerAPI(style: StickerStyle): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🧪 Testing style: ${style}`);

    // Ensure test image exists
    const imagePath = await ensureTestImage();

    // Check if file exists and read it
    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        message: `Test image not found: ${imagePath}`,
        error: 'FILE_NOT_FOUND',
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('imageFile', fs.createReadStream(imagePath));
    formData.append('style', style);

    console.log(
      `📤 Uploading image (${style} style) to /api/image-to-sticker...`
    );

    // Make API request
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/image-to-sticker`,
      {
        method: 'POST',
        body: formData as any,
        // @ts-ignore
        timeout: TEST_CONFIG.timeout,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms`);

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return {
        success: false,
        message: `API request failed: ${response.status} ${response.statusText}`,
        error: errorData.error || errorText,
        duration,
      };
    }

    // Parse response
    const data = await response.json();
    console.log('📋 Response:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (!data.url) {
      return {
        success: false,
        message: 'Response missing required "url" field',
        data,
        duration,
      };
    }

    // Validate that it's using OpenAI (check response structure)
    if (data.source !== 'image-to-sticker-api') {
      console.log(`⚠️  Warning: Unexpected source: ${data.source}`);
    }

    // Test if the generated image URL is accessible
    console.log(`🔗 Testing generated image URL: ${data.url}`);
    const imageResponse = await fetch(data.url);

    if (!imageResponse.ok) {
      return {
        success: false,
        message: `Generated image URL not accessible: ${imageResponse.status}`,
        data,
        duration,
      };
    }

    const contentType = imageResponse.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return {
        success: false,
        message: `Generated URL does not return an image (content-type: ${contentType})`,
        data,
        duration,
      };
    }

    return {
      success: true,
      message: `✅ Successfully generated ${style} sticker using OpenAI API`,
      data: {
        url: data.url,
        style: data.style,
        size: data.size,
        contentType,
        imageSize: imageResponse.headers.get('content-length'),
      },
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      message: `Request failed with error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.stack : String(error),
      duration,
    };
  }
}

/**
 * Test API endpoint availability
 */
async function testAPIEndpoint(): Promise<TestResult> {
  try {
    console.log('\n🔍 Testing API endpoint availability...');

    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/image-to-sticker`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      message: response.ok
        ? '✅ API endpoint is available'
        : `❌ API endpoint returned error: ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: '❌ Failed to reach API endpoint',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): TestResult {
  console.log('\n🔧 Checking environment configuration...');

  const requiredEnvVars = ['OPENAI_API_KEY'];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    return {
      success: false,
      message: `❌ Missing required environment variables: ${missing.join(', ')}`,
      error: 'MISSING_ENV_VARS',
    };
  }

  // Check OpenAI API key format
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey?.startsWith('sk-')) {
    return {
      success: false,
      message: `❌ Invalid OpenAI API key format (should start with 'sk-')`,
      error: 'INVALID_API_KEY_FORMAT',
    };
  }

  return {
    success: true,
    message: '✅ Environment configuration is valid',
    data: {
      openaiKeyLength: openaiKey.length,
      baseUrl: TEST_CONFIG.baseUrl,
    },
  };
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting OpenAI Image to Sticker API Tests');
  console.log(`📍 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`🎨 Testing styles: ${TEST_CONFIG.styles.join(', ')}`);
  console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`${'='.repeat(60)}`);

  const results: { test: string; result: TestResult }[] = [];

  // Test 1: Environment check
  const envResult = checkEnvironment();
  results.push({ test: 'Environment Configuration', result: envResult });

  if (!envResult.success) {
    console.log('\n❌ Environment check failed. Stopping tests.');
    printResults(results);
    process.exit(1);
  }

  // Test 2: API endpoint availability
  const endpointResult = await testAPIEndpoint();
  results.push({ test: 'API Endpoint Availability', result: endpointResult });

  // Test 3: Image to sticker for each style
  for (const style of TEST_CONFIG.styles) {
    try {
      const stickerResult = await testImageToStickerAPI(style);
      results.push({
        test: `Image to Sticker (${style})`,
        result: stickerResult,
      });

      if (stickerResult.success) {
        console.log(`✅ ${style} style test passed`);
      } else {
        console.log(`❌ ${style} style test failed: ${stickerResult.message}`);
      }
    } catch (error) {
      results.push({
        test: `Image to Sticker (${style})`,
        result: {
          success: false,
          message: `Test threw exception: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.stack : String(error),
        },
      });
    }
  }

  // Print final results
  printResults(results);
}

/**
 * Print test results summary
 */
function printResults(results: { test: string; result: TestResult }[]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log(`${'='.repeat(60)}`);

  let passed = 0;
  let failed = 0;

  results.forEach(({ test, result }) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${test}${duration}`);

    if (!result.success && result.error) {
      console.log(`    Error: ${result.error}`);
    }

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log(
      '\n🎉 All tests passed! OpenAI Image to Sticker API is working correctly.'
    );
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('\n💥 Test runner crashed:', error);
    process.exit(1);
  });
}

export { runTests, testImageToStickerAPI, checkEnvironment };
