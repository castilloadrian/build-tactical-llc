import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json();
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Define your Stripe price IDs - replace with actual IDs from your Stripe dashboard
    const priceIds = {
      'price_1RcsDfR9SQjspoGcqaWrTBiV': 'price_1RcsDfR9SQjspoGcqaWrTBiV', // Monthly plan
      'price_1RcsLDR9SQjspoGcP6zpBvPc': 'price_1RcsLDR9SQjspoGcP6zpBvPc', // 6-month plan
    };

    const priceId = priceIds[planId as keyof typeof priceIds];
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 