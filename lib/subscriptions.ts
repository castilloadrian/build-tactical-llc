import { createClient } from '@/utils/supabase/server';
import { SubscriptionData, PlanType } from './polar';

export interface CreateSubscriptionData {
  user_id: string;
  polar_subscription_id: string;
  polar_product_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  plan_type: PlanType;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
}

export interface UpdateSubscriptionData {
  status?: 'active' | 'cancelled' | 'expired' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  plan_type?: PlanType;
}

// Create a new subscription in Supabase
export async function createSubscription(data: CreateSubscriptionData) {
  const supabase = await createClient();
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: data.user_id,
      polar_subscription_id: data.polar_subscription_id,
      polar_product_id: data.polar_product_id,
      status: data.status,
      plan_type: data.plan_type,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }

  return subscription;
}

// Get subscription by user ID
export async function getSubscriptionByUserId(userId: string) {
  const supabase = await createClient();
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error getting subscription:', error);
    throw new Error('Failed to get subscription');
  }

  return subscription;
}

// Get subscription by Polar subscription ID
export async function getSubscriptionByPolarId(polarSubscriptionId: string) {
  const supabase = await createClient();
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('polar_subscription_id', polarSubscriptionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting subscription:', error);
    throw new Error('Failed to get subscription');
  }

  return subscription;
}

// Update subscription in Supabase
export async function updateSubscription(polarSubscriptionId: string, updates: UpdateSubscriptionData) {
  const supabase = await createClient();
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('polar_subscription_id', polarSubscriptionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }

  return subscription;
}

// Check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getSubscriptionByUserId(userId);
  return subscription !== null && subscription.status === 'active';
}

// Get user's subscription plan
export async function getUserPlan(userId: string): Promise<PlanType | null> {
  const subscription = await getSubscriptionByUserId(userId);
  return subscription?.plan_type || null;
}

// Check if user is on free trial
export async function isOnFreeTrial(userId: string): Promise<boolean> {
  const subscription = await getSubscriptionByUserId(userId);
  return subscription?.plan_type === 'free_trial' && subscription?.status === 'trialing';
}

// Cancel subscription (mark for cancellation at period end)
export async function cancelSubscription(polarSubscriptionId: string) {
  return await updateSubscription(polarSubscriptionId, {
    cancel_at_period_end: true,
    status: 'cancelled',
  });
}

// Reactivate subscription (remove cancellation)
export async function reactivateSubscription(polarSubscriptionId: string) {
  return await updateSubscription(polarSubscriptionId, {
    cancel_at_period_end: false,
    status: 'active',
  });
} 