import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { upgradeFromFreeTrial, createPaidSubscription, hasUserHadFreeTrial } from '@/utils/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Ignore events older than deployment (prevent processing old retry events)
    const deploymentTime = new Date('2025-06-22T23:00:00Z'); // Update this timestamp
    const eventTime = new Date(event.created * 1000);
    
    if (eventTime < deploymentTime) {
      console.log(`Ignoring old event ${event.id} from ${eventTime}`);
      return NextResponse.json({ received: true });
    }
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;
      
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createClient();
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType as 'monthly' | 'six-month';

  console.log(`Processing checkout session ${session.id} for user ${userId} with plan ${planType}`);

  if (!userId || !planType) {
    console.error('Missing metadata in checkout session', { sessionId: session.id, userId, planType });
    return;
  }

  // Validate plan type
  if (!['monthly', 'six-month'].includes(planType)) {
    console.error('Invalid plan type:', planType);
    return;
  }

  // Store the Stripe customer ID in the user's profile
  if (session.customer) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error storing Stripe customer ID:', profileError);
    } else {
      console.log(`Stored Stripe customer ID ${session.customer} for user ${userId}`);
    }
  }

  // Check if user has had a free trial
  const hasHadTrial = await hasUserHadFreeTrial(userId);
  
  let success: boolean;
  if (hasHadTrial) {
    // User has had a trial, try to upgrade the existing record
    success = await upgradeFromFreeTrial(userId, planType, session.subscription as string);
  } else {
    // User hasn't had a trial, create a new subscription
    success = await createPaidSubscription(userId, planType, session.subscription as string);
  }
  
  if (success) {
    console.log(`User ${userId} successfully ${hasHadTrial ? 'upgraded to' : 'created'} ${planType} plan`);
  } else {
    console.error(`Failed to ${hasHadTrial ? 'upgrade' : 'create'} ${planType} plan for user ${userId}`);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Get customer details to find the user
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  // Find user by Stripe customer ID
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !user) {
    console.error('Could not find user for Stripe customer:', customerId);
    return;
  }

  // Update subscription with Stripe subscription ID
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (updateError) {
    console.error('Error updating subscription with Stripe ID:', updateError);
  } else {
    console.log(`Updated subscription for user ${user.id} with Stripe subscription ${subscription.id}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !user) {
    console.error('Could not find user for Stripe customer:', customerId);
    return;
  }

  // Update subscription status based on Stripe subscription status
  let status = 'active';
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    status = 'expired';
  }

  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Error updating subscription status:', updateError);
  } else {
    console.log(`Updated subscription status for user ${user.id} to ${status}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !user) {
    console.error('Could not find user for Stripe customer:', customerId);
    return;
  }

  // Mark subscription as expired
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Error marking subscription as expired:', updateError);
  } else {
    console.log(`Marked subscription as expired for user ${user.id}`);
  }
} 