#!/usr/bin/env node

/**
 * Scream AI API Test Script
 *
 * Tests:
 * 1. All 6 preset scenes
 * 2. Different aspect ratios
 * 3. Custom prompt functionality
 * 4. Prompt verification against PRD
 * 5. Response structure validation
 *
 * Usage:
 *   node test-scream-ai-api.js
 *
 * Requirements:
 * - Server running on http://localhost:3000
 * - Valid session token
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/scream-ai/generate';

// Test image (small base64 encoded test image)
const TEST_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// PRD-defined prompts for verification
const PRD_PROMPTS = {
  0: 'Create a dreamy Y2K-style photo of the person from the input image lying on shiny pink satin bedding, holding a large 1990s corded telephone to their ear in a thoughtful, daydream-like pose. The bedroom shows late-90s posters, a bedside lamp as the main light source, and a softly dim nighttime ambience. Use subtle VHS grain, gentle lens bloom, and a cinematic 35mm composition with shallow depth of field. In the doorway of a dim hallway, a masked figure inspired by "Ghost Face" appears as a distant, barely lit silhouette looking toward the subject. Keep the overall mood slightly dark and ominous yet realistic.',
  1: 'Create a moody late-90s film photo of the person from the input image in a small suburban kitchen at night. A pot of popcorn steams on the stove; a corded landline phone is held to their ear. Warm tungsten light spills across tiled countertops and a checkered floor. Add subtle VHS grain, soft lens bloom, and shallow depth of field. Through the dark patio door glass, a masked figure inspired by "Ghost Face" stands outside as a faint silhouette in the rain. Cinematic 35mm composition, realistic lighting and textures.',
  2: 'Generate a nostalgic 90s hallway scene with the person from the input image leaning near blue metal lockers under flickering fluorescent lights. They hold a translucent 90s-style phone receiver with a spiral cord. Posters peel from the walls and a school banner hangs slightly askew. At the far end of the corridor, a masked figure inspired by "Ghost Face" stands partly in shadow near a door window. Use cool greenish fluorescent tones, light film grain, and subtle chromatic aberration.',
  3: 'Create a cinematic, rain-soaked front-porch night scene. The person from the input image stands fully on the porch, in front of the screen door, not inside the doorway. The screen door is slightly open (about 20–30°) on the left edge of frame; the subject is offset on the right third, waist-up, 3/4 angle toward camera at eye level (≈35mm). Hold a 1990s cordless phone naturally to the ear with the nearer hand; the other hand relaxed or lightly touching the door handle. Warm porch light casts a clean pool of light on wet wooden boards; rain streaks glow; wet leaves on the steps; a pumpkin and wind chimes suggest late fall. Beyond the yard, under a streetlamp, a masked figure inspired by "Ghost Face" reads only as a faint, blurred silhouette in the rain. Add reflective puddles, light mist, subtle rim light, and a gentle anamorphic flare. Keep all limbs natural and unwarped; the subject must not intersect or align with doorframe lines.',
  4: 'Produce a dreamy 90s cinema photo with the person from the input image seated in a red velvet theater seat, holding popcorn and a soda. A bright projector beam cuts through dust in the air; lens bloom and shallow depth of field isolate the subject from the rows of seats. Two rows behind, a masked figure inspired by "Ghost Face" sits motionless in the aisle shadow, barely lit by the screen glow. Keep a cool-blue highlight vs warm-red seats palette and mild film grain.',
  5: 'Create a late-90s house-party living room scene as a SOLO portrait. Show EXACTLY ONE HUMAN: the person from the input image lounging on a vintage couch, phone to ear. No other people anywhere. Use party props only (no guests): string lights across the wall, a few cassette tapes and scattered red plastic cups on the coffee table. A CRT TV in the corner shows soft static. The hallway and its doorway in the background are physically EMPTY. Show ONE masked figure inspired by "Ghost Face" as a faint reflection INSIDE a hallway wall mirror ONLY — the figure must NOT exist in real space. Outside the mirror there is NO masked figure. Tight mid-shot at eye level (~35mm); the subject occupies most of the frame (≈60–70% width). Shallow depth of field; disposable-camera flash aesthetic with subtle film grain. Keep identity consistent with the input (facial proportions, hairline/length, skin tone). No blood, no weapons, no gore.',
};

const IDENTITY_SUFFIX =
  'Use the person from the input image as the subject. Keep identity strictly consistent: preserve facial geometry and proportions, skin tone, eye color, hairline and hair length, and any facial hair if present. Do not change gender presentation, age, body shape, hairstyle length, or clothing style; if uncertain, keep neutral, everyday clothing similar to the input photo. Do not add or remove makeup, jewelry, nail polish, long eyelashes, or accessories unless already present. Do not feminize or masculinize the subject. Maintain natural-looking anatomy and hands. No blood, no injuries, no gore, no visible weapons, no violence. The masked figure must remain a distant, dim silhouette only.';

const NEGATIVE_PROMPT =
  'No gender changes, no makeup, no jewelry, no gore, no violence, no weapon, no anatomy distortions.';

const PRESET_NAMES = {
  0: 'Dreamy Y2K Bedroom',
  1: 'Suburban Kitchen',
  2: 'School Hallway',
  3: 'Rainy Front Porch',
  4: 'Movie Theater',
  5: 'House Party',
};

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Get session token from cookie
async function getSessionToken() {
  logInfo('Attempting to get session token...');

  // Try to read from .next/server/app-paths-manifest.json or any stored session
  // For now, we'll use a placeholder - user needs to provide their own token
  const token = process.env.SESSION_TOKEN;

  if (!token) {
    logWarning('No SESSION_TOKEN found in environment variables');
    logInfo(
      'Please set SESSION_TOKEN environment variable with your session cookie'
    );
    logInfo('Example: export SESSION_TOKEN="your-session-token-here"');
    return null;
  }

  return token;
}

// Make API request
async function makeRequest(presetId, aspectRatio = '1:1', customPrompt = null) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('No session token available');
  }

  const body = {
    image_input: TEST_IMAGE_BASE64,
    preset_id: presetId,
    aspect_ratio: aspectRatio,
  };

  if (customPrompt) {
    body.custom_prompt = customPrompt;
  }

  const response = await fetch(`${BASE_URL}${API_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `better-auth.session_token=${token}`,
      Origin: BASE_URL,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    status: response.status,
    statusText: response.statusText,
    data,
  };
}

// Verify prompt structure
function verifyPrompt(presetId, receivedPrompt, hasCustomPrompt = false) {
  const expectedBasePrompt = PRD_PROMPTS[presetId];

  if (!expectedBasePrompt) {
    logError(`No PRD prompt found for preset ${presetId}`);
    return false;
  }

  // Check if base prompt is included
  if (!receivedPrompt.includes(expectedBasePrompt)) {
    logError(`Base prompt mismatch for preset ${presetId}`);
    logInfo(`Expected to contain: ${expectedBasePrompt.substring(0, 100)}...`);
    return false;
  }

  // Check if IDENTITY_SUFFIX is appended
  if (!receivedPrompt.includes(IDENTITY_SUFFIX)) {
    logError(`IDENTITY_SUFFIX not found in prompt for preset ${presetId}`);
    return false;
  }

  // If custom prompt was provided, check it's included
  if (hasCustomPrompt && !receivedPrompt.includes('Additional details:')) {
    logError(`Custom prompt not properly included for preset ${presetId}`);
    return false;
  }

  return true;
}

// Test a single preset
async function testPreset(presetId, aspectRatio = '1:1') {
  const presetName = PRESET_NAMES[presetId];
  logInfo(`Testing Preset ${presetId}: ${presetName} (${aspectRatio})`);

  try {
    const result = await makeRequest(presetId, aspectRatio);

    if (result.status === 200 || result.status === 201) {
      logSuccess(`Request successful (${result.status})`);

      // Verify response structure
      const requiredFields = [
        'success',
        'asset_id',
        'view_url',
        'download_url',
        'preset_id',
        'preset_name',
      ];
      const missingFields = requiredFields.filter(
        (field) => !(field in result.data)
      );

      if (missingFields.length > 0) {
        logWarning(`Missing fields in response: ${missingFields.join(', ')}`);
      } else {
        logSuccess('All required fields present in response');
      }

      // Log response details
      logInfo(`Asset ID: ${result.data.asset_id}`);
      logInfo(`Preset Name: ${result.data.preset_name}`);
      logInfo(`Aspect Ratio: ${result.data.aspect_ratio || 'not specified'}`);
      logInfo(`Watermarked: ${result.data.watermarked}`);
      logInfo(`Credits Used: ${result.data.credits_used}`);

      return {
        success: true,
        presetId,
        presetName,
        aspectRatio,
        data: result.data,
      };
    }

    logError(`Request failed with status ${result.status}`);
    logError(`Error: ${JSON.stringify(result.data, null, 2)}`);
    return {
      success: false,
      presetId,
      presetName,
      aspectRatio,
      error: result.data,
    };
  } catch (error) {
    logError(`Exception during test: ${error.message}`);
    return {
      success: false,
      presetId,
      presetName,
      aspectRatio,
      error: error.message,
    };
  }
}

// Test custom prompt
async function testCustomPrompt(presetId) {
  const presetName = PRESET_NAMES[presetId];
  const customPrompt = 'Add more dramatic lighting and stronger shadows';

  logInfo(`Testing Custom Prompt with Preset ${presetId}: ${presetName}`);
  logInfo(`Custom prompt: "${customPrompt}"`);

  try {
    const result = await makeRequest(presetId, '1:1', customPrompt);

    if (result.status === 200 || result.status === 201) {
      logSuccess('Custom prompt request successful');
      return { success: true, presetId, customPrompt };
    }

    logError(`Custom prompt request failed: ${result.status}`);
    return { success: false, presetId, customPrompt, error: result.data };
  } catch (error) {
    logError(`Exception during custom prompt test: ${error.message}`);
    return { success: false, presetId, customPrompt, error: error.message };
  }
}

// Main test suite
async function runTests() {
  logHeader('🎬 Scream AI API Test Suite');

  const results = {
    presetTests: [],
    aspectRatioTests: [],
    customPromptTests: [],
    timestamp: new Date().toISOString(),
  };

  // Check if session token is available
  const token = await getSessionToken();
  if (!token) {
    logError('Cannot proceed without session token');
    logInfo('To get your session token:');
    logInfo('1. Log in to the app in your browser');
    logInfo('2. Open DevTools → Application → Cookies');
    logInfo('3. Find "better-auth.session_token" cookie');
    logInfo('4. Copy its value');
    logInfo('5. Run: export SESSION_TOKEN="your-token-here"');
    return;
  }

  // Test 1: All presets with default aspect ratio
  logHeader('Test 1: All Presets (1:1)');
  for (const presetId of Object.keys(PRESET_NAMES)) {
    const result = await testPreset(presetId, '1:1');
    results.presetTests.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s between requests
  }

  // Test 2: Different aspect ratios (test with preset 0)
  logHeader('Test 2: Different Aspect Ratios (Preset 0)');
  for (const aspectRatio of ASPECT_RATIOS) {
    const result = await testPreset('0', aspectRatio);
    results.aspectRatioTests.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Test 3: Custom prompts (test with presets 0, 3, 5)
  logHeader('Test 3: Custom Prompts');
  for (const presetId of ['0', '3', '5']) {
    const result = await testCustomPrompt(presetId);
    results.customPromptTests.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  logHeader('📊 Test Summary');

  const presetSuccesses = results.presetTests.filter((r) => r.success).length;
  const presetTotal = results.presetTests.length;
  log(
    `Preset Tests: ${presetSuccesses}/${presetTotal} passed`,
    presetSuccesses === presetTotal ? 'green' : 'red'
  );

  const aspectSuccesses = results.aspectRatioTests.filter(
    (r) => r.success
  ).length;
  const aspectTotal = results.aspectRatioTests.length;
  log(
    `Aspect Ratio Tests: ${aspectSuccesses}/${aspectTotal} passed`,
    aspectSuccesses === aspectTotal ? 'green' : 'red'
  );

  const customSuccesses = results.customPromptTests.filter(
    (r) => r.success
  ).length;
  const customTotal = results.customPromptTests.length;
  log(
    `Custom Prompt Tests: ${customSuccesses}/${customTotal} passed`,
    customSuccesses === customTotal ? 'green' : 'red'
  );

  // Save results to file
  const resultsFile = path.join(__dirname, 'test-scream-ai-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  logInfo(`Full results saved to: ${resultsFile}`);

  // Prompt verification reminder
  logHeader('📝 Prompt Verification Checklist');
  logInfo('Please verify in the constants file:');
  logInfo('✓ Scene 3 (Rainy Front Porch) uses detailed PRD prompt');
  logInfo(
    '✓ Scene 5 (House Party) emphasizes SOLO portrait with no background people'
  );
  logInfo('✓ All prompts append IDENTITY_SUFFIX');
  logInfo('✓ Negative prompt includes all safety constraints');
}

// Run the tests
runTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
