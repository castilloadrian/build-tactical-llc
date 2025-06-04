import { NextRequest, NextResponse } from 'next/server';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/dist/esm/webhooks';
import { createSubscription, updateSubscription, getSubscriptionByPolarId } from '@/lib/subscriptions';
import { POLAR_PRODUCT_IDS, PlanType } from '@/lib/polar';

export async function POST(request: NextRequest) {
  try {
    // Get raw body and headers for webhook validation
    const body = await request.text();
    
    // Convert headers to Record<string, string> format
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Validate webhook signature
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
      throw error;
    }

    console.log('Received Polar webhook event:', event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
        
      case 'subscription.revoked':
        await handleSubscriptionRevoked(event.data);
        break;
        
      case 'order.created':
        await handleOrderCreated(event.data);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('Processing subscription created:', subscription.id);

    // Determine plan type from product ID
    const planType = getPlanTypeFromProductId(subscription.product_id);
    if (!planType) {
      console.error('Unknown product ID:', subscription.product_id);
      return;
    }

    // Get user ID from metadata or customer external ID
    const userId = subscription.metadata?.user_id || subscription.customer?.external_id;
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }

    await createSubscription({
      user_id: userId,
      polar_subscription_id: subscription.id,
      polar_product_id: subscription.product_id,
      status: subscription.status === 'active' ? 'active' : 'trialing',
      plan_type: planType,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    });

    console.log('Subscription created successfully in database');
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('Processing subscription updated:', subscription.id);

    await updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    });

    console.log('Subscription updated successfully in database');
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionRevoked(subscription: any) {
  try {
    console.log('Processing subscription revoked:', subscription.id);

    await updateSubscription(subscription.id, {
      status: 'expired',
    });

    console.log('Subscription revoked successfully in database');
  } catch (error) {
    console.error('Error handling subscription revoked:', error);
  }
}

async function handleOrderCreated(order: any) {
  try {
    console.log('Processing order created:', order.id);
    
    // For one-time purchases or subscription starts
    // You can add additional logic here if needed
    
    console.log('Order processed successfully');
  } catch (error) {
    console.error('Error handling order created:', error);
  }
}

function getPlanTypeFromProductId(productId: string): PlanType | null {
  if (productId === POLAR_PRODUCT_IDS.MONTHLY) {
    return 'monthly';
  } else if (productId === POLAR_PRODUCT_IDS.YEARLY) {
    return 'yearly';
  }
  return null;
} 