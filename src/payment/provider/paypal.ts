import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreatePortalParams,
  PaymentProvider,
  PortalResult,
  Subscription,
  getSubscriptionsParams,
} from '../types';

/**
 * Minimal PayPal provider implementation
 *
 * PayPal subscription flows are currently handled entirely on the client
 * through the SDK button, so server-side checkout and portal flows are
 * not supported.
 */
export class PayPalProvider implements PaymentProvider {
  async createCheckout(_: CreateCheckoutParams): Promise<CheckoutResult> {
    throw new Error('PayPal checkout is handled on the client.');
  }

  async createCustomerPortal(_: CreatePortalParams): Promise<PortalResult> {
    throw new Error('PayPal customer portal is not supported.');
  }

  async getSubscriptions(_: getSubscriptionsParams): Promise<Subscription[]> {
    // No subscription data is available server-side at this time.
    return [];
  }

  async handleWebhookEvent(_: string, __: string): Promise<void> {
    // Webhook handling not implemented for PayPal yet.
    return;
  }
}
