import { randomUUID } from 'crypto';
import { allocateCreditsToUser } from '@/actions/allocate-credits-action';
import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { payment, user } from '@/db/schema';
import { findPlanByPlanId, findPriceInPlan } from '@/lib/price-plan';
import { sendNotification } from '@/notification/notification';
import { Creem } from 'creem';
import { desc, eq } from 'drizzle-orm';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreatePortalParams,
  PaymentProvider,
  PaymentStatus,
  PaymentType,
  PlanInterval,
  PortalResult,
  Price,
  Subscription,
  getSubscriptionsParams,
} from '../types';
import { PaymentTypes, PlanIntervals } from '../types';

/**
 * Creem payment provider (scaffold)
 *
 * This class follows the PaymentProvider interface and is wired into
 * the app through `websiteConfig.payment.provider = 'creem'`.
 *
 * Implementation notes:
 * - Fill the TODO sections with real Creem API calls once
 *   API keys and price IDs are provided.
 */
export class CreemProvider implements PaymentProvider {
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.webhookSecret = process.env.CREEM_WEBHOOK_SECRET || '';

    if (!this.apiKey) {
      console.warn('[CreemProvider] CREEM_API_KEY is not set.');
    }
    if (!this.webhookSecret) {
      console.warn('[CreemProvider] CREEM_WEBHOOK_SECRET is not set.');
    }
  }

  /**
   * Create a checkout session for a plan
   */
  public async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CheckoutResult> {
    const {
      planId,
      priceId,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata,
      locale,
    } = params;

    // Validate plan and price first (local config guard)
    const plan = findPlanByPlanId(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }
    const price = findPriceInPlan(planId, priceId);
    if (!price) {
      throw new Error(`Price ID ${priceId} not found in plan ${planId}`);
    }

    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not set');
    }

     try {
       // Initialize Creem SDK
       const creem = new Creem();

       const customMetadata = {
         ...metadata,
         planId,
         priceId,
         userId: metadata?.userId || '',
       } as Record<string, any>;

       console.log(
         '[CreemProvider] Creating checkout with API key:',
         this.apiKey ? 'SET' : 'MISSING'
       );
       console.log('[CreemProvider] Request data:', {
         productId: priceId,
         customerEmail,
         successUrl,
         metadata: customMetadata,
       });

       const res = await creem.createCheckout({
         xApiKey: this.apiKey,
         createCheckoutRequest: {
           productId: priceId, // In Creem, productId is used to create checkout
           units: 1,
           customer: {
             email: customerEmail,
           },
           successUrl: successUrl ?? undefined,
           metadata: customMetadata,
         },
       });

      // SDK returns the entity directly
      const checkoutUrl = (res as any)?.checkoutUrl;
      const id = (res as any)?.id;
      if (!checkoutUrl || !id) {
        console.error(
          '[CreemProvider] Unexpected createCheckout response:',
          res
        );
        throw new Error('Invalid checkout response from Creem');
      }

      return { url: checkoutUrl, id };
    } catch (err) {
      console.error('[CreemProvider] createCheckout error:', err);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a customer portal session
   */
  public async createCustomerPortal(
    params: CreatePortalParams
  ): Promise<PortalResult> {
    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not set');
    }
    try {
      // Initialize Creem SDK
      const creem = new Creem();

      console.log(
        '[CreemProvider] Creating customer portal with API key:',
        this.apiKey ? 'SET' : 'MISSING'
      );
      console.log('[CreemProvider] Customer ID:', params.customerId);

      const res = await creem.generateCustomerLinks({
        xApiKey: this.apiKey,
        createCustomerPortalLinkRequestEntity: {
          customerId: params.customerId,
        },
      });
      const url = (res as any)?.customerPortalLink as string | undefined;
      if (!url) {
        throw new Error('Invalid portal response from Creem');
      }
      return { url };
    } catch (err) {
      console.error('[CreemProvider] createCustomerPortal error:', err);
      throw new Error('Failed to create customer portal session');
    }
  }

  /**
   * Get customer subscriptions by userId (from local DB)
   *
   * We primarily return data from our DB which is synced by webhooks.
   */
  public async getSubscriptions(
    params: getSubscriptionsParams
  ): Promise<Subscription[]> {
    const { userId } = params;
    try {
      const db = await getDb();
      const subscriptions = await db
        .select()
        .from(payment)
        .where(eq(payment.userId, userId))
        .orderBy(desc(payment.createdAt));

      return subscriptions.map((sub) => ({
        id: sub.subscriptionId || '',
        customerId: sub.customerId,
        priceId: sub.priceId,
        status: sub.status as PaymentStatus,
        type: sub.type as PaymentType,
        interval: sub.interval as PlanInterval,
        currentPeriodStart: sub.periodStart || undefined,
        currentPeriodEnd: sub.periodEnd || undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        trialStartDate: sub.trialStart || undefined,
        trialEndDate: sub.trialEnd || undefined,
        createdAt: sub.createdAt,
      }));
    } catch (error) {
      console.error('[CreemProvider] getSubscriptions error:', error);
      return [];
    }
  }

  /**
   * Handle webhook events
   *
   * This scaffold does a minimal parse and logs the payload. Replace with
   * real signature verification and event handling.
   */
  public async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<void> {
    if (!this.webhookSecret) {
      console.warn(
        '[CreemProvider] Missing CREEM_WEBHOOK_SECRET; skipping signature verification.'
      );
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      console.error('[CreemProvider] Invalid webhook payload (not JSON).');
      throw new Error('Invalid webhook payload');
    }

    const type = event?.type || 'unknown';
    console.log(`[CreemProvider] Webhook received: ${type}`);

    // TODO: Map Creem event types to local handlers
    // Suggested mapping once docs are available:
    // - subscription.created / updated / canceled -> create/update/delete subscription records
    // - checkout.completed (one-time) -> create one-time payment record and allocate credits
    // For now, we only log.
  }

  // Helpers (example signatures kept to guide implementation)

  private mapInterval(interval?: string | null): PlanInterval | undefined {
    switch (interval) {
      case 'month':
        return PlanIntervals.MONTH;
      case 'year':
        return PlanIntervals.YEAR;
      default:
        return undefined;
    }
  }
}
