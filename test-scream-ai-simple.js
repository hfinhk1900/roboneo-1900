#!/usr/bin/env node

/**
 * Simple Scream AI Test Script
 *
 * Usage:
 *   node test-scream-ai-simple.js <image-path> <preset-id> [aspect-ratio]
 *
 * Example:
 *   node test-scream-ai-simple.js ./test.jpg 0 1:1
 *   node test-scream-ai-simple.js ./photo.png 3 16:9
 *
 * Preset IDs:
 *   0 - Dreamy Y2K Bedroom
 *   1 - Suburban Kitchen
 *   2 - School Hallway
 *   3 - Rainy Front Porch
 *   4 - Movie Theater
 *   5 - House Party
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PRESET_NAMES = {
  0: 'Dreamy Y2K Bedroom',
  1: 'Suburban Kitchen',
  2: 'School Hallway',
  3: 'Rainy Front Porch',
  4: 'Movie Theater',
  5: 'House Party',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();

  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';

  return `data:${mimeType};base64,${base64}`;
}

async function testScreamAI(imagePath, presetId, aspectRatio = '1:1') {
  const token = process.env.SESSION_TOKEN;

  if (!token) {
    log('❌ SESSION_TOKEN not found in environment', 'red');
    log('Please set it with: export SESSION_TOKEN="your-token-here"', 'yellow');
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    log(`❌ Image file not found: ${imagePath}`, 'red');
    process.exit(1);
  }

  log('\n🎬 Scream AI Test', 'cyan');
  log(`Image: ${imagePath}`, 'cyan');
  log(`Preset: ${presetId} - ${PRESET_NAMES[presetId] || 'Unknown'}`, 'cyan');
  log(`Aspect Ratio: ${aspectRatio}`, 'cyan');
  log('', 'reset');

  try {
    const imageBase64 = imageToBase64(imagePath);
    log(`✓ Image loaded (${Math.round(imageBase64.length / 1024)}KB)`, 'green');

    const body = {
      image_input: imageBase64,
      preset_id: presetId,
      aspect_ratio: aspectRatio,
    };

    log('📤 Sending request...', 'cyan');
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/scream-ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `better-auth.session_token=${token}`,
        Origin: BASE_URL,
      },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();

    log(`\n⏱️  Response time: ${elapsed}ms`, 'cyan');
    log(
      `📊 Status: ${response.status} ${response.statusText}`,
      response.status === 200 ? 'green' : 'red'
    );

    if (response.status === 200) {
      log('\n✅ Success!', 'green');
      log(`Asset ID: ${data.asset_id}`, 'cyan');
      log(`View URL: ${data.view_url}`, 'cyan');
      log(`Download URL: ${data.download_url}`, 'cyan');
      log(`Preset: ${data.preset_name}`, 'cyan');
      log(`Aspect Ratio: ${data.aspect_ratio}`, 'cyan');
      log(`Watermarked: ${data.watermarked}`, 'cyan');
      log(`Credits Used: ${data.credits_used}`, 'cyan');
      log(`Remaining Credits: ${data.remaining_credits}`, 'cyan');

      // Save result to file
      const resultFile = path.join(
        __dirname,
        `scream-ai-result-${Date.now()}.json`
      );
      fs.writeFileSync(resultFile, JSON.stringify(data, null, 2));
      log(`\n💾 Result saved to: ${resultFile}`, 'green');
    } else {
      log('\n❌ Failed', 'red');
      log(JSON.stringify(data, null, 2), 'red');
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  log(
    'Usage: node test-scream-ai-simple.js <image-path> <preset-id> [aspect-ratio]',
    'yellow'
  );
  log('\nPreset IDs:', 'cyan');
  Object.entries(PRESET_NAMES).forEach(([id, name]) => {
    log(`  ${id} - ${name}`, 'cyan');
  });
  log('\nAspect Ratios: 1:1, 3:4, 4:3, 9:16, 16:9', 'cyan');
  process.exit(1);
}

const [imagePath, presetId, aspectRatio = '1:1'] = args;

testScreamAI(imagePath, presetId, aspectRatio);
