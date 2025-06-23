import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Don't cancel free trials through Stripe (they're not Stripe subscriptions)
    if (subscription.plan_type === 'free-trial') {
      // Just mark as expired in our database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('plan_type', 'free-trial');

      if (updateError) {
        console.error('Error canceling trial:', updateError);
        return NextResponse.json(
          { error: 'Failed to cancel trial' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Free trial canceled successfully' 
      });
    }

    // Cancel paid subscription in Stripe
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription ID not found' },
        { status: 404 }
      );
    }

    // Cancel the subscription at period end (so they keep access until expiration)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update our database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription canceled successfully. Access will continue until the end of your billing period.'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 