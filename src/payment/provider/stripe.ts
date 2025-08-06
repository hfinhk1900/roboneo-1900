import { randomUUID } from 'crypto';
import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { payment, session, user } from '@/db/schema';
import { findPlanByPlanId, findPriceInPlan } from '@/lib/price-plan';
import { sendNotification } from '@/notification/notification';
import { allocateCreditsToUser } from '@/actions/allocate-credits-action';
import { desc, eq } from 'drizzle-orm';
import { Stripe } from 'stripe';
import {
  type CheckoutResult,
  type CreateCheckoutParams,
  type CreatePortalParams,
  type PaymentProvider,
  type PaymentStatus,
  type PaymentType,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type PortalResult,
  type Price,
  type Subscription,
  type getSubscriptionsParams,
} from '../types';

/**
 * Stripe payment provider implementation
 *
 * docs:
 * https://mksaas.com/docs/payment
 */
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  /**
   * Initialize Stripe provider with API key
   */
  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set.');
    }

    // Initialize Stripe without specifying apiVersion to use default/latest version
    this.stripe = new Stripe(apiKey);
    this.webhookSecret = webhookSecret;
  }

  /**
   * Create a customer in Stripe if not exists
   * @param email Customer email
   * @param name Optional customer name
   * @returns Stripe customer ID
   */
  private async createOrGetCustomer(
    email: string,
    name?: string
  ): Promise<string> {
    try {
      // Search for existing customer
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      // Find existing customer
      if (customers.data && customers.data.length > 0) {
        const customerId = customers.data[0].id;

        // Find user id by customer id
        const userId = await this.findUserIdByCustomerId(customerId);
        // user does not exist, update user with customer id
        // in case you deleted user in database, but forgot to delete customer in Stripe
        if (!userId) {
          console.log(
            `User ${email} does not exist, update with customer id ${customerId}`
          );
          await this.updateUserWithCustomerId(customerId, email);
        }
        return customerId;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name: name || undefined,
      });

      // Update user record in database with the new customer ID
      await this.updateUserWithCustomerId(customer.id, email);

      return customer.id;
    } catch (error) {
      console.error('Create or get customer error:', error);
      throw new Error('Failed to create or get customer');
    }
  }

  /**
   * Updates a user record with a Stripe customer ID
   * @param customerId Stripe customer ID
   * @param email Customer email
   * @returns Promise that resolves when the update is complete
   */
  private async updateUserWithCustomerId(
    customerId: string,
    email: string
  ): Promise<void> {
    try {
      // Update user record with customer ID if email matches
      const db = await getDb();
      const result = await db
        .update(user)
        .set({
          customerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(user.email, email))
        .returning({ id: user.id });

      if (result.length > 0) {
        console.log(`Updated user ${email} with customer ID ${customerId}`);
      } else {
        console.log(`No user found with email ${email}`);
      }
    } catch (error) {
      console.error('Update user with customer ID error:', error);
      throw new Error('Failed to update user with customer ID');
    }
  }

  /**
   * Finds a user by customerId
   * @param customerId Stripe customer ID
   * @returns User ID or undefined if not found
   */
  private async findUserIdByCustomerId(
    customerId: string
  ): Promise<string | undefined> {
    try {
      // Query the user table for a matching customerId
      const db = await getDb();
      const result = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.customerId, customerId))
        .limit(1);

      if (result.length > 0) {
        return result[0].id;
      }
      console.warn(`No user found with customerId ${customerId}`);

      return undefined;
    } catch (error) {
      console.error('Find user by customer ID error:', error);
      return undefined;
    }
  }

  /**
   * Create a checkout session for a plan
   * @param params Parameters for creating the checkout session
   * @returns Checkout result
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

    try {
      // Get plan and price
      const plan = findPlanByPlanId(planId);
      if (!plan) {
        console.error(`StripeProvider: Plan with ID ${planId} not found`);
        throw new Error(`Plan with ID ${planId} not found`);
      }

      // Find price in plan
      const price = findPriceInPlan(planId, priceId);
      if (!price) {
        console.error(
          `StripeProvider: Price ID ${priceId} not found in plan ${planId}`
        );
        console.error(
          `StripeProvider: Available plans:`,
          websiteConfig.price.plans
        );
        if (planId === 'pro') {
          console.error(
            'Pro plan prices:',
            websiteConfig.price.plans.pro.prices.map((p) => ({
              priceId: p.priceId,
              interval: p.interval,
            }))
          );
        } else if (planId === 'ultimate') {
          console.error(
            'Ultimate plan prices:',
            websiteConfig.price.plans.ultimate.prices.map((p) => ({
              priceId: p.priceId,
              interval: p.interval,
            }))
          );
        }
        throw new Error(`Price ID ${priceId} not found in plan ${planId}`);
      }

      // Get userName from metadata if available
      const userName = metadata?.userName;

      // Create or get customer
      const customerId = await this.createOrGetCustomer(
        customerEmail,
        userName
      );
      console.log(`StripeProvider: Got customerId: ${customerId}`);

      // Add planId, priceId and userId to metadata, so we can get it in the webhook event
      const customMetadata = {
        ...metadata,
        planId,
        priceId,
        userId: metadata?.userId || '',
      };

      // Set up the line items
      const lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
      console.log(`StripeProvider: Set up lineItems with price: ${priceId}`);

      // Create checkout session parameters
      const checkoutParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode:
          price.type === PaymentTypes.SUBSCRIPTION ? 'subscription' : 'payment',
        success_url: successUrl ?? '',
        cancel_url: cancelUrl ?? '',
        metadata: customMetadata,
        allow_promotion_codes: price.allowPromotionCode ?? false,
      };

      // Add customer to checkout session
      checkoutParams.customer = customerId;

      // Add locale if provided
      if (locale) {
        checkoutParams.locale = this.mapLocaleToStripeLocale(
          locale
        ) as Stripe.Checkout.SessionCreateParams.Locale;
      }

      // Add payment intent data for one-time payments
      if (price.type === PaymentTypes.ONE_TIME) {
        checkoutParams.payment_intent_data = {
          metadata: customMetadata,
        };
        // Automatically create an invoice for the one-time payment
        checkoutParams.invoice_creation = {
          enabled: true,
        };
      }

      // Add subscription data for recurring payments
      if (price.type === PaymentTypes.SUBSCRIPTION) {
        // Initialize subscription_data with metadata
        checkoutParams.subscription_data = {
          metadata: customMetadata,
        };

        // Add trial period if applicable
        if (price.trialPeriodDays && price.trialPeriodDays > 0) {
          checkoutParams.subscription_data.trial_period_days =
            price.trialPeriodDays;
        }
      }

      console.log(
        `StripeProvider: Creating checkout session with params:`,
        JSON.stringify(
          {
            mode: checkoutParams.mode,
            customer: checkoutParams.customer,
            line_items: checkoutParams.line_items,
          },
          null,
          2
        )
      );

      // Create the checkout session
      const session =
        await this.stripe.checkout.sessions.create(checkoutParams);

      console.log(`StripeProvider: Created session with ID: ${session.id}`);

      return {
        url: session.url!,
        id: session.id,
      };
    } catch (error) {
      console.error('StripeProvider: Create checkout session error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a customer portal session
   * @param params Parameters for creating the portal
   * @returns Portal result
   */
  public async createCustomerPortal(
    params: CreatePortalParams
  ): Promise<PortalResult> {
    const { customerId, returnUrl, locale } = params;

    try {
      console.log(
        `创建客户门户会话，客户ID: ${customerId}, 返回URL: ${returnUrl}`
      );

      if (!customerId) {
        console.error('创建客户门户失败：缺少客户ID');
        throw new Error('Customer ID is required');
      }

      // 验证客户ID是否存在于Stripe
      try {
        const customer = await this.stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted) {
          console.error(`客户ID ${customerId} 在Stripe中不存在或已被删除`);
          throw new Error(
            `Customer with ID ${customerId} not found or deleted`
          );
        }
      } catch (retrieveError) {
        console.error(`验证客户ID失败: ${retrieveError}`);
        throw new Error(
          `Failed to validate customer: ${retrieveError instanceof Error ? retrieveError.message : 'Unknown error'}`
        );
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl ?? '',
        locale: locale
          ? (this.mapLocaleToStripeLocale(
              locale
            ) as Stripe.BillingPortal.SessionCreateParams.Locale)
          : undefined,
      });

      console.log(`客户门户会话创建成功，URL: ${session.url}`);

      return {
        url: session.url,
      };
    } catch (error) {
      console.error(`创建客户门户错误:`, error);
      console.error(`错误详情:`, JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to create customer portal: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get subscriptions
   * @param params Parameters for getting subscriptions
   * @returns Array of subscription objects
   */
  public async getSubscriptions(
    params: getSubscriptionsParams
  ): Promise<Subscription[]> {
    const { userId } = params;

    try {
      // Build query to fetch subscriptions from database
      const db = await getDb();
      const subscriptions = await db
        .select()
        .from(payment)
        .where(eq(payment.userId, userId))
        .orderBy(desc(payment.createdAt)); // Sort by creation date, newest first

      // Log what we found in the database
      console.log(
        `Found ${subscriptions.length} payment records in database for user ${userId}`
      );

      // If no subscriptions found in database, check if user has a customer ID
      if (subscriptions.length === 0) {
        console.log(
          `No subscriptions found in database, trying to find customer ID for user ${userId}`
        );

        // Find customer ID for this user
        const userResult = await db
          .select({ customerId: user.customerId })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (userResult.length > 0 && userResult[0].customerId) {
          const customerId = userResult[0].customerId;
          console.log(
            `Found customer ID ${customerId} for user ${userId}, checking with Stripe`
          );

          // Check with Stripe directly for active subscriptions for this customer
          try {
            const stripeSubscriptions = await this.stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 10,
            });

            if (stripeSubscriptions.data.length > 0) {
              console.log(
                `Found ${stripeSubscriptions.data.length} active subscriptions in Stripe for customer ${customerId}`
              );

              // For each subscription found, create a payment record in the database
              for (const stripeSubscription of stripeSubscriptions.data) {
                console.log(
                  `Syncing Stripe subscription ${stripeSubscription.id} to database`
                );
                await this.createPaymentRecord(stripeSubscription, userId);
              }

              // Refresh subscriptions from database
              const refreshedSubscriptions = await db
                .select()
                .from(payment)
                .where(eq(payment.userId, userId))
                .orderBy(desc(payment.createdAt));

              console.log(
                `After sync, found ${refreshedSubscriptions.length} payment records`
              );

              // Map database records to our subscription model
              return refreshedSubscriptions.map((subscription) => ({
                id: subscription.subscriptionId || '',
                customerId: subscription.customerId,
                priceId: subscription.priceId,
                status: subscription.status as PaymentStatus,
                type: subscription.type as PaymentTypes,
                interval: subscription.interval as PlanInterval,
                currentPeriodStart: subscription.periodStart || undefined,
                currentPeriodEnd: subscription.periodEnd || undefined,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
                trialStartDate: subscription.trialStart || undefined,
                trialEndDate: subscription.trialEnd || undefined,
                createdAt: subscription.createdAt,
              }));
            }
          } catch (stripeError) {
            console.error(
              'Error checking Stripe for subscriptions:',
              stripeError
            );
          }
        }
      }

      // Map database records to our subscription model
      return subscriptions.map((subscription) => ({
        id: subscription.subscriptionId || '',
        customerId: subscription.customerId,
        priceId: subscription.priceId,
        status: subscription.status as PaymentStatus,
        type: subscription.type as PaymentTypes,
        interval: subscription.interval as PlanInterval,
        currentPeriodStart: subscription.periodStart || undefined,
        currentPeriodEnd: subscription.periodEnd || undefined,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        trialStartDate: subscription.trialStart || undefined,
        trialEndDate: subscription.trialEnd || undefined,
        createdAt: subscription.createdAt,
      }));
    } catch (error) {
      console.error('List customer subscriptions error:', error);
      return [];
    }
  }

  /**
   * Handle webhook event
   * @param payload Raw webhook payload
   * @param signature Webhook signature
   */
  public async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<void> {
    try {
      // 验证事件签名
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      const eventType = event.type;
      console.log(`Webhook事件接收: ${eventType}`);
      console.log(`事件ID: ${event.id}`);

      // 处理订阅事件
      if (eventType.startsWith('customer.subscription.')) {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        console.log(`订阅事件: ${eventType}，订阅ID: ${stripeSubscription.id}`);
        console.log(`客户ID: ${stripeSubscription.customer}`);
        console.log(`订阅状态: ${stripeSubscription.status}`);
        console.log(`订阅元数据:`, stripeSubscription.metadata);

        // 根据订阅状态和事件类型处理
        switch (eventType) {
          case 'customer.subscription.created': {
            console.log('处理订阅创建事件');
            await this.onCreateSubscription(stripeSubscription);
            break;
          }
          case 'customer.subscription.updated': {
            await this.onUpdateSubscription(stripeSubscription);
            break;
          }
          case 'customer.subscription.deleted': {
            await this.onDeleteSubscription(stripeSubscription);
            break;
          }
        }
      } else if (eventType === 'checkout.session.completed') {
        // 处理结账完成事件
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `结账会话完成，模式: ${session.mode}，支付状态: ${session.payment_status}`
        );
        console.log(`结账会话元数据:`, session.metadata);

        // 处理一次性付款
        if (session.mode === 'payment') {
          console.log('处理一次性付款');
          await this.onOnetimePayment(session);
        }
        // 处理订阅付款
        else if (session.mode === 'subscription' && session.subscription) {
          console.log(`处理订阅结账事件，订阅ID: ${session.subscription}`);
          try {
            // 获取订阅详情
            const subscriptionId = session.subscription as string;
            const subscription =
              await this.stripe.subscriptions.retrieve(subscriptionId);
            console.log(`获取订阅信息成功，状态: ${subscription.status}`);

            // 从session的metadata中获取userId
            const userId = session.metadata?.userId;
            if (!userId) {
              console.warn(
                `未找到用户ID，尝试从客户ID查找: ${subscription.customer}`
              );
              const retrievedUserId = await this.findUserIdByCustomerId(
                subscription.customer as string
              );
              if (retrievedUserId) {
                console.log(`从客户ID找到用户ID: ${retrievedUserId}`);
                await this.createPaymentRecord(subscription, retrievedUserId);
              } else {
                console.error(`无法确定用户ID，无法保存订阅记录`);
              }
            } else {
              console.log(`使用元数据中的用户ID: ${userId}`);
              await this.createPaymentRecord(subscription, userId);
            }
          } catch (error) {
            console.error('处理订阅信息失败:', error);
          }
        }
      }
    } catch (error) {
      console.error('处理webhook事件失败:', error);
      throw new Error('Failed to handle webhook event');
    }
  }

  /**
   * Create payment record
   * @param stripeSubscription Stripe subscription
   */
  private async onCreateSubscription(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    console.log(
      `>> Create payment record for Stripe subscription ${stripeSubscription.id}`
    );
    const customerId = stripeSubscription.customer as string;

    // get priceId from subscription items (this is always available)
    const priceId = stripeSubscription.items.data[0]?.price.id;
    if (!priceId) {
      console.warn(
        `<< No priceId found for subscription ${stripeSubscription.id}`
      );
      return;
    }

    // get userId from metadata, we add it in the createCheckout session
    const userId = stripeSubscription.metadata.userId;
    if (!userId) {
      console.warn(
        `<< No userId found in metadata for subscription ${stripeSubscription.id}, attempting to find from customer ID`
      );

      // Try to find userId from customer ID as fallback
      const retrievedUserId = await this.findUserIdByCustomerId(customerId);
      if (!retrievedUserId) {
        console.error(
          `<< Unable to find userId for subscription ${stripeSubscription.id} from customer ID ${customerId}`
        );
        return;
      }

      console.log(
        `<< Retrieved userId ${retrievedUserId} from customer ID ${customerId}`
      );
      return this.createPaymentRecord(stripeSubscription, retrievedUserId);
    }

    return this.createPaymentRecord(stripeSubscription, userId);
  }

  /**
   * Create a payment record in the database
   * @param stripeSubscription Stripe subscription
   * @param userId User ID for the payment record
   */
  private async createPaymentRecord(
    stripeSubscription: Stripe.Subscription,
    userId: string
  ): Promise<void> {
    const customerId = stripeSubscription.customer as string;

    // get priceId from subscription items (this is always available)
    const priceId = stripeSubscription.items.data[0]?.price.id;
    if (!priceId) {
      console.warn(
        `<< No priceId found for subscription ${stripeSubscription.id}`
      );
      return;
    }

    // create fields
    const createFields: any = {
      id: randomUUID(),
      priceId: priceId,
      type: PaymentTypes.SUBSCRIPTION,
      userId: userId,
      customerId: customerId,
      subscriptionId: stripeSubscription.id,
      interval: this.mapStripeIntervalToPlanInterval(stripeSubscription),
      status: this.mapSubscriptionStatusToPaymentStatus(
        stripeSubscription.status
      ),
      periodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null,
      periodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    const result = await db
      .insert(payment)
      .values(createFields)
      .returning({ id: payment.id });

    if (result.length > 0) {
      console.log(
        `<< Created new payment record ${result[0].id} for Stripe subscription ${stripeSubscription.id}`
      );

      // Allocate credits to the user based on their subscription
      try {
        const creditsResult = await allocateCreditsToUser(userId, undefined, priceId);
        if (creditsResult.success) {
          console.log(
            `✅ Allocated ${creditsResult.creditsAllocated} credits to user ${userId} for subscription ${stripeSubscription.id}`
          );
        } else {
          console.error(
            `❌ Failed to allocate credits to user ${userId}: ${creditsResult.error}`
          );
        }
      } catch (error) {
        console.error('Error allocating credits after subscription creation:', error);
      }
    } else {
      console.warn(
        `<< No payment record created for Stripe subscription ${stripeSubscription.id}`
      );
    }
  }

  /**
   * Update payment record
   * @param stripeSubscription Stripe subscription
   */
  private async onUpdateSubscription(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    console.log(
      `>> Update payment record for Stripe subscription ${stripeSubscription.id}`
    );

    // get priceId from subscription items (this is always available)
    const priceId = stripeSubscription.items.data[0]?.price.id;
    if (!priceId) {
      console.warn(
        `<< No priceId found for subscription ${stripeSubscription.id}`
      );
      return;
    }

    // update fields
    const updateFields: any = {
      priceId: priceId,
      interval: this.mapStripeIntervalToPlanInterval(stripeSubscription),
      status: this.mapSubscriptionStatusToPaymentStatus(
        stripeSubscription.status
      ),
      periodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : undefined,
      periodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : undefined,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : undefined,
      updatedAt: new Date(),
    };

    const db = await getDb();
    const result = await db
      .update(payment)
      .set(updateFields)
      .where(eq(payment.subscriptionId, stripeSubscription.id))
      .returning({ id: payment.id });

    if (result.length > 0) {
      console.log(
        `<< Updated payment record ${result[0].id} for Stripe subscription ${stripeSubscription.id}`
      );
    } else {
      console.warn(
        `<< No payment record found for Stripe subscription ${stripeSubscription.id}`
      );
    }
  }

  /**
   * Update payment record, set status to canceled
   * @param stripeSubscription Stripe subscription
   */
  private async onDeleteSubscription(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    console.log(
      `>> Mark payment record for Stripe subscription ${stripeSubscription.id} as canceled`
    );
    const db = await getDb();
    const result = await db
      .update(payment)
      .set({
        status: this.mapSubscriptionStatusToPaymentStatus(
          stripeSubscription.status
        ),
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, stripeSubscription.id))
      .returning({ id: payment.id });

    if (result.length > 0) {
      console.log(
        `<< Marked payment record for subscription ${stripeSubscription.id} as canceled`
      );
    } else {
      console.warn(
        `<< No payment record found to cancel for Stripe subscription ${stripeSubscription.id}`
      );
    }
  }

  /**
   * Handle one-time payment
   * @param session Stripe checkout session
   */
  private async onOnetimePayment(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const customerId = session.customer as string;
    console.log(`>> Handle onetime payment for customer ${customerId}`);

    // get userId from session metadata, we add it in the createCheckout session
    const userId = session.metadata?.userId;
    if (!userId) {
      console.warn(
        `<< No userId found in metadata for checkout session ${session.id}, attempting to find from customer ID`
      );

      // Try to find userId from customer ID as fallback
      const retrievedUserId = await this.findUserIdByCustomerId(customerId);
      if (!retrievedUserId) {
        console.error(
          `<< Unable to find userId for checkout session ${session.id} from customer ID ${customerId}`
        );
        return;
      }

      console.log(
        `<< Retrieved userId ${retrievedUserId} from customer ID ${customerId}`
      );
      return this.createOnetimePaymentRecord(
        session,
        retrievedUserId,
        customerId
      );
    }

    return this.createOnetimePaymentRecord(session, userId, customerId);
  }

  /**
   * Create a one-time payment record in the database
   * @param session Stripe checkout session
   * @param userId User ID for the payment record
   * @param customerId Customer ID for the payment record
   */
  private async createOnetimePaymentRecord(
    session: Stripe.Checkout.Session,
    userId: string,
    customerId: string
  ): Promise<void> {
    // get priceId from session metadata, not from line items
    const priceId = session.metadata?.priceId;
    if (!priceId) {
      console.warn(`<< No priceId found for checkout session ${session.id}`);
      return;
    }

    // Create a one-time payment record
    const now = new Date();
    const db = await getDb();
    const result = await db
      .insert(payment)
      .values({
        id: randomUUID(),
        priceId: priceId,
        type: PaymentTypes.ONE_TIME,
        userId: userId,
        customerId: customerId,
        status: 'completed', // One-time payments are always completed
        periodStart: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: payment.id });

    if (result.length === 0) {
      console.warn(
        `<< Failed to create one-time payment record for user ${userId}`
      );
      return;
    }
    console.log(
      `<< Created one-time payment record for user ${userId}, price: ${priceId}`
    );

    // Allocate credits to the user based on their one-time purchase
    try {
      const creditsResult = await allocateCreditsToUser(userId, undefined, priceId);
      if (creditsResult.success) {
        console.log(
          `✅ Allocated ${creditsResult.creditsAllocated} credits to user ${userId} for one-time payment ${session.id}`
        );
      } else {
        console.error(
          `❌ Failed to allocate credits to user ${userId}: ${creditsResult.error}`
        );
      }
    } catch (error) {
      console.error('Error allocating credits after one-time payment:', error);
    }

    // Send notification
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    await sendNotification(session.id, customerId, userId, amount);
  }

  /**
   * Map Stripe subscription interval to our own interval types
   * @param subscription Stripe subscription
   * @returns PlanInterval
   */
  private mapStripeIntervalToPlanInterval(
    subscription: Stripe.Subscription
  ): PlanInterval {
    switch (subscription.items.data[0]?.plan.interval) {
      case 'month':
        return PlanIntervals.MONTH;
      case 'year':
        return PlanIntervals.YEAR;
      default:
        return PlanIntervals.MONTH;
    }
  }

  /**
   * Convert Stripe subscription status to PaymentStatus,
   * we narrow down the status to our own status types
   * @param status Stripe subscription status
   * @returns PaymentStatus
   */
  private mapSubscriptionStatusToPaymentStatus(
    status: Stripe.Subscription.Status
  ): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      active: 'active',
      canceled: 'canceled',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
      past_due: 'past_due',
      trialing: 'trialing',
      unpaid: 'unpaid',
      paused: 'paused',
    };

    return statusMap[status] || 'failed';
  }

  /**
   * Map application locale to Stripe's supported locales
   * @param locale Application locale (e.g., 'en', 'zh-CN')
   * @returns Stripe locale string
   */
  private mapLocaleToStripeLocale(locale: string): string {
    // Stripe supported locales as of 2023:
    // https://stripe.com/docs/js/appendix/supported_locales
    const stripeLocales = [
      'bg',
      'cs',
      'da',
      'de',
      'el',
      'en',
      'es',
      'et',
      'fi',
      'fil',
      'fr',
      'hr',
      'hu',
      'id',
      'it',
      'ja',
      'ko',
      'lt',
      'lv',
      'ms',
      'mt',
      'nb',
      'nl',
      'pl',
      'pt',
      'ro',
      'ru',
      'sk',
      'sl',
      'sv',
      'th',
      'tr',
      'vi',
      'zh',
    ];

    // First check if the exact locale is supported
    if (stripeLocales.includes(locale)) {
      return locale;
    }

    // If not, try to get the base language
    const baseLocale = locale.split('-')[0];
    if (stripeLocales.includes(baseLocale)) {
      return baseLocale;
    }

    // Default to auto to let Stripe detect the language
    return 'auto';
  }
}
