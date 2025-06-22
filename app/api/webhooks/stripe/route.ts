import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

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
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update user's subscription status in your database
  // This is where you would update your user's profile with subscription info
  console.log(`User ${userId} completed checkout for plan ${planId}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Get customer details to find the user
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  // Update user's subscription status
  console.log(`Subscription created for customer ${customerId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Update user's subscription status based on the new state
  console.log(`Subscription updated for customer ${customerId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;
  
  // Update user's subscription status to reflect cancellation
  console.log(`Subscription deleted for customer ${customerId}`);
} 