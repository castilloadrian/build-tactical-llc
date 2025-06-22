import { createClient } from '@/utils/supabase/client';

/**
 * Subscription Management System
 * 
 * This system handles user subscriptions with the following approach:
 * 
 * 1. FREE TRIAL:
 *    - Users can start a free trial once
 *    - Trial lasts 24 hours
 *    - Trial records are stored in user_subscriptions table
 * 
 * 2. UPGRADING FROM TRIAL:
 *    - When a user upgrades from a free trial, we UPDATE the existing record
 *    - This maintains a single subscription history per user
 *    - The trial_expires_at field is cleared and subscription_expires_at is set
 * 
 * 3. DIRECT PAID SUBSCRIPTION:
 *    - Users who haven't had a trial get a new subscription record
 *    - This applies to users who go directly to paid plans
 * 
 * 4. SUBSCRIPTION LIFECYCLE:
 *    - Active subscriptions are tracked with status: 'active'
 *    - Expired subscriptions are marked with status: 'expired'
 *    - Stripe integration updates subscription status via webhooks
 * 
 * Database Schema (user_subscriptions table):
 * - user_id: UUID (references auth.users)
 * - plan_type: 'free-trial' | 'monthly' | 'six-month'
 * - status: 'active' | 'expired' | 'cancelled'
 * - trial_expires_at: timestamp (for free trials)
 * - subscription_expires_at: timestamp (for paid plans)
 * - stripe_subscription_id: string (for Stripe integration)
 * - created_at: timestamp
 * - updated_at: timestamp
 */

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planType?: 'free-trial' | 'monthly' | 'six-month';
  expiresAt?: Date;
  isTrial?: boolean;
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = createClient();
  
  try {
    // Query the database for user's subscription status
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking subscription status:', error);
      return { hasActiveSubscription: false };
    }
    
    if (!data) {
      return { hasActiveSubscription: false };
    }
    
    // Check if trial has expired
    if (data.plan_type === 'free-trial' && data.trial_expires_at) {
      const trialExpiresAt = new Date(data.trial_expires_at);
      const now = new Date();
      
      if (now > trialExpiresAt) {
        // Trial has expired, update status
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('plan_type', 'free-trial');
        
        return { hasActiveSubscription: false };
      }
      
      return {
        hasActiveSubscription: true,
        planType: 'free-trial',
        expiresAt: trialExpiresAt,
        isTrial: true
      };
    }
    
    // Check if paid subscription has expired
    if (data.subscription_expires_at) {
      const subscriptionExpiresAt = new Date(data.subscription_expires_at);
      const now = new Date();
      
      if (now > subscriptionExpiresAt) {
        // Subscription has expired, update status
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        return { hasActiveSubscription: false };
      }
      
      return {
        hasActiveSubscription: true,
        planType: data.plan_type as 'monthly' | 'six-month',
        expiresAt: subscriptionExpiresAt,
        isTrial: false
      };
    }
    
    // Active subscription without expiration (ongoing)
    return {
      hasActiveSubscription: true,
      planType: data.plan_type as 'monthly' | 'six-month',
      isTrial: false
    };
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { hasActiveSubscription: false };
  }
}

export async function activateFreeTrial(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Set trial expiration to 24 hours from now
    const trialExpiresAt = new Date();
    trialExpiresAt.setHours(trialExpiresAt.getHours() + 24);
    
    // Update user's subscription in the database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'free-trial',
        status: 'active',
        trial_expires_at: trialExpiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Database error:', error);
      return false;
    }
    
    console.log(`Free trial activated for user ${userId}, expires at ${trialExpiresAt}`);
    return true;
  } catch (error) {
    console.error('Error activating free trial:', error);
    return false;
  }
}

export async function shouldShowPricingPage(userId: string): Promise<boolean> {
  try {
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    return !subscriptionStatus.hasActiveSubscription;
  } catch (error) {
    console.error('Error checking if pricing page should be shown:', error);
    return true; // Default to showing pricing page if there's an error
  }
}

export async function hasUserHadFreeTrial(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Check if user has ever had a free trial (regardless of current status)
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_type', 'free-trial')
      .limit(1);
    
    if (error) {
      console.error('Error checking free trial history:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking free trial history:', error);
    return false;
  }
}

export async function upgradeFromFreeTrial(
  userId: string, 
  newPlanType: 'monthly' | 'six-month',
  stripeSubscriptionId?: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // First, check if user has an existing free trial record
    const { data: existingTrial, error: trialError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', 'free-trial')
      .single();
    
    if (trialError && trialError.code !== 'PGRST116') {
      console.error('Error checking existing trial:', trialError);
      return false;
    }
    
    // Calculate subscription expiration based on plan type
    const subscriptionExpiresAt = new Date();
    if (newPlanType === 'monthly') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
    } else if (newPlanType === 'six-month') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 6);
    }
    
    if (existingTrial) {
      // Update the existing free trial record
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: newPlanType,
          status: 'active',
          trial_expires_at: null, // Clear trial expiration
          subscription_expires_at: subscriptionExpiresAt.toISOString(),
          stripe_subscription_id: stripeSubscriptionId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTrial.id);
      
      if (updateError) {
        console.error('Error upgrading from free trial:', updateError);
        return false;
      }
      
      console.log(`User ${userId} upgraded from free trial to ${newPlanType}, expires at ${subscriptionExpiresAt}`);
      return true;
    } else {
      // No existing trial record, create a new paid subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_type: newPlanType,
          status: 'active',
          subscription_expires_at: subscriptionExpiresAt.toISOString(),
          stripe_subscription_id: stripeSubscriptionId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating new paid subscription:', insertError);
        return false;
      }
      
      console.log(`User ${userId} created new ${newPlanType} subscription, expires at ${subscriptionExpiresAt}`);
      return true;
    }
  } catch (error) {
    console.error('Error upgrading from free trial:', error);
    return false;
  }
}

export async function createPaidSubscription(
  userId: string,
  planType: 'monthly' | 'six-month',
  stripeSubscriptionId?: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Calculate subscription expiration based on plan type
    const subscriptionExpiresAt = new Date();
    if (planType === 'monthly') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
    } else if (planType === 'six-month') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 6);
    }
    
    // Create a new paid subscription record
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        stripe_subscription_id: stripeSubscriptionId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating paid subscription:', insertError);
      return false;
    }
    
    console.log(`User ${userId} created new ${planType} subscription, expires at ${subscriptionExpiresAt}`);
    return true;
  } catch (error) {
    console.error('Error creating paid subscription:', error);
    return false;
  }
}

export async function hasUserAccess(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // First, check if user has an active subscription
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    if (subscriptionStatus.hasActiveSubscription) {
      return true;
    }
    
    // If no active subscription, check if user is an Org Owner
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return false;
    }
    
    // Org Owners have access regardless of organizations
    if (userData.role === 'Org Owner') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

export async function hasProjectProposalsAccess(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // First, check if user has an active subscription
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    if (subscriptionStatus.hasActiveSubscription) {
      return true;
    }
    
    // If no active subscription, check if user is an Org Owner with organizations
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return false;
    }
    
    // Check if user is an Org Owner
    if (userData.role === 'Org Owner') {
      // Check if user has associated organizations
      const { data: userOrgs, error: orgError } = await supabase
        .from('user-org')
        .select('org_id')
        .eq('user_id', userId);
      
      if (orgError) {
        console.error('Error checking user organizations:', orgError);
        return false;
      }
      
      // User has access if they are an Org Owner with at least one organization
      return userOrgs && userOrgs.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking project proposals access:', error);
    return false;
  }
} 