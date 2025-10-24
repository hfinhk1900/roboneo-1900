#!/usr/bin/env node

/**
 * Scream AI API Debug Test
 *
 * 测试 Scream AI API 连接的各个步骤
 */

const fs = require('fs');
const path = require('path');

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${type.toUpperCase()}: ${msg}${colors.reset}`);
}

async function testHealth() {
  log('Testing server health...', 'info');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    log(
      `Server status: ${data.status}`,
      data.status === 'ok' ? 'success' : 'warn'
    );
    log(`DB OK: ${data.db.ok}`, data.db.ok ? 'success' : 'error');
    log(
      `Idempotency OK: ${data.upstash.idempotency_ok}`,
      data.upstash.idempotency_ok ? 'success' : 'warn'
    );
    return true;
  } catch (err) {
    log(`Health check failed: ${err.message}`, 'error');
    return false;
  }
}

async function testApiWithoutAuth() {
  log('Testing Scream AI API without authentication...', 'info');
  try {
    const res = await fetch(`${BASE_URL}/api/scream-ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_input: TEST_IMAGE_BASE64,
        preset_id: '0',
        aspect_ratio: '1:1',
      }),
    });
    const data = await res.json();
    log(`Status: ${res.status}`, 'info');
    log(
      `Response: ${JSON.stringify(data, null, 2)}`,
      res.status === 401 ? 'warn' : 'error'
    );
    return res.status === 401; // Expected unauthorized
  } catch (err) {
    log(`API test failed: ${err.message}`, 'error');
    return false;
  }
}

async function testNanoBananaConnectivity() {
  log('Testing Nano Banana API connectivity...', 'info');
  const apiKey = process.env.NANO_BANANA_API_KEY;
  let baseUrl = process.env.NANO_BANANA_BASE_URL || 'https://api.kie.ai';

  // Ensure baseUrl doesn't have trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');

  if (!apiKey) {
    log('NANO_BANANA_API_KEY not set', 'error');
    return false;
  }

  try {
    // Test the job-based API endpoint
    const payload = {
      model: 'google/nano-banana',
      input: {
        prompt: 'A test image',
        image_size: '1:1',
        output_format: 'png',
      },
    };

    const endpoint = `${baseUrl}/api/v1/jobs/createTask`;
    log(`Connecting to: ${endpoint}`, 'info');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    log(`Status: ${res.status}`, res.ok ? 'success' : 'error');
    const text = await res.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        log(`Response: ${JSON.stringify(data, null, 2)}`, 'info');
      } catch {
        log(`Response (raw): ${text.substring(0, 200)}...`, 'info');
      }
    }
    return res.ok || res.status === 400; // 400 might be validation error, but API is reachable
  } catch (err) {
    log(`Nano Banana connectivity test failed: ${err.message}`, 'error');
    return false;
  }
}

async function runTests() {
  log('Starting Scream AI API Debug Tests', 'info');
  console.log('========================================\n');

  const healthOk = await testHealth();
  console.log();

  const authOk = await testApiWithoutAuth();
  console.log();

  const nanoOk = await testNanoBananaConnectivity();
  console.log();

  console.log('========================================');
  log('Test Summary', 'info');
  log(
    `✓ Server Health: ${healthOk ? 'PASS' : 'FAIL'}`,
    healthOk ? 'success' : 'error'
  );
  log(
    `✓ Auth Required: ${authOk ? 'PASS' : 'FAIL'}`,
    authOk ? 'success' : 'error'
  );
  log(
    `✓ Nano Banana API: ${nanoOk ? 'REACHABLE' : 'UNREACHABLE'}`,
    nanoOk ? 'success' : 'error'
  );
}

runTests().catch((err) => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
