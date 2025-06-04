import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

// Product IDs - You'll need to create these in your Polar dashboard
export const POLAR_PRODUCT_IDS = {
  MONTHLY: process.env.POLAR_MONTHLY_PRODUCT_ID,
  YEARLY: process.env.POLAR_YEARLY_PRODUCT_ID,
} as const;

// Plan types
export type PlanType = 'free_trial' | 'monthly' | 'yearly';

export interface SubscriptionData {
  id: string;
  user_id: string;
  polar_subscription_id: string;
  polar_product_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  plan_type: PlanType;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSessionData {
  customer_email: string;
  success_url: string;
  product_id: string;
  customer_name?: string;
  customer_external_id?: string;
  metadata?: Record<string, any>;
}

// Helper function to create checkout sessions
export async function createCheckoutSession(data: CheckoutSessionData) {
  try {
    const response = await polar.checkouts.create({
      products: [data.product_id],
      successUrl: data.success_url,
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      customerExternalId: data.customer_external_id,
      metadata: data.metadata,
    });
    
    return response;
  } catch (error) {
    console.error('Error creating Polar checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Helper function to get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const response = await polar.subscriptions.get({
      id: subscriptionId,
    });
    
    return response;
  } catch (error) {
    console.error('Error getting Polar subscription:', error);
    throw new Error('Failed to get subscription details');
  }
}

// Helper function to update subscription (e.g., cancel at period end)
export async function updateSubscription(subscriptionId: string, updates: any) {
  try {
    const response = await polar.subscriptions.update({
      id: subscriptionId,
      ...updates,
    });
    
    return response;
  } catch (error) {
    console.error('Error updating Polar subscription:', error);
    throw new Error('Failed to update subscription');
  }
} 