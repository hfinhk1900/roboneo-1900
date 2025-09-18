import { auth } from '@/lib/auth';
import { Creem } from 'creem';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Test Creem API connectivity and permissions
 * Only accessible to authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creemApiKey = process.env.CREEM_API_KEY;

    if (!creemApiKey) {
      return NextResponse.json(
        { error: 'CREEM_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('[Creem API Test] Starting API test...');
    console.log('[Creem API Test] API Key length:', creemApiKey.length);
    console.log(
      '[Creem API Test] API Key prefix:',
      creemApiKey.substring(0, 8) + '...'
    );

    const creem = new Creem();
    const testResults: any = {
      apiKeySet: true,
      apiKeyLength: creemApiKey.length,
      apiKeyPrefix: creemApiKey.substring(0, 8) + '...',
      tests: {},
    };

    // Test 1: Check API key format and basic validation
    testResults.tests.apiKeyValidation = {
      success: true,
      checks: {
        hasApiKey: !!creemApiKey,
        keyLength: creemApiKey.length,
        keyFormat: creemApiKey.startsWith('creem_') 
          ? 'Correct Creem format' 
          : creemApiKey.startsWith('sk_') 
          ? 'Stripe format (WRONG for Creem!)' 
          : 'Unknown format',
        environment: creemApiKey.includes('test') ? 'test' : 'production',
        isValidCreemFormat: creemApiKey.startsWith('creem_'),
      },
    };

    // Test 2: Try to create a minimal checkout with a simple product
    try {
      console.log('[Creem API Test] Testing minimal checkout creation...');
      const testCheckout = await creem.createCheckout({
        xApiKey: creemApiKey,
        createCheckoutRequest: {
          productId: 'test-product-id', // This will likely fail, but we want to see the error
          units: 1,
          customer: {
            email: 'test@example.com',
          },
          successUrl: 'https://example.com/success',
        },
      });
      testResults.tests.createCheckout = {
        success: true,
        data: testCheckout,
      };
    } catch (error: any) {
      console.log('[Creem API Test] Checkout creation failed:', error.message);
      testResults.tests.createCheckout = {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
        body: error.body,
      };
    }

    // Test 3: Try with the actual product ID from the error
    try {
      console.log('[Creem API Test] Testing with actual product ID...');
      const actualCheckout = await creem.createCheckout({
        xApiKey: creemApiKey,
        createCheckoutRequest: {
          productId: 'prod_rbE5gREcbO1fQUrsCjYXQ', // From your error log
          units: 1,
          customer: {
            email: 'test@example.com',
          },
          successUrl: 'https://roboneo-art.vercel.app/success',
        },
      });
      testResults.tests.actualProductCheckout = {
        success: true,
        data: actualCheckout,
      };
    } catch (error: any) {
      console.log(
        '[Creem API Test] Actual product checkout failed:',
        error.message
      );
      testResults.tests.actualProductCheckout = {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
        body: error.body,
      };
    }

    console.log('[Creem API Test] Test results:', testResults);

    return NextResponse.json({
      success: true,
      testResults,
      recommendations: [
        testResults.tests.createCheckout?.statusCode === 403
          ? 'API Key may not have sufficient permissions'
          : null,
        testResults.tests.actualProductCheckout?.error?.includes('product')
          ? 'Product ID may not exist in your Creem account'
          : null,
        !testResults.tests.apiKeyValidation?.checks?.isValidCreemFormat
          ? 'CRITICAL: API key is not in Creem format (should start with "creem_")'
          : null,
        testResults.tests.apiKeyValidation?.checks?.keyFormat?.includes('Stripe')
          ? 'ERROR: You are using a Stripe API key instead of Creem API key!'
          : null,
        'Check Creem dashboard for valid product IDs',
        'Verify API key is from the correct Creem account',
        'Ensure API key has checkout creation permissions',
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('[Creem API Test] Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
