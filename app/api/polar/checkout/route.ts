import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCheckoutSession, POLAR_PRODUCT_IDS } from '@/lib/polar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan_type } = body;

    // Validate plan type
    if (!plan_type || !['monthly', 'yearly'].includes(plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly" or "yearly".' },
        { status: 400 }
      );
    }

    // Get user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    // Get product ID based on plan type
    const productId = plan_type === 'monthly' 
      ? POLAR_PRODUCT_IDS.MONTHLY 
      : POLAR_PRODUCT_IDS.YEARLY;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create checkout session with Polar
    const checkoutSession = await createCheckoutSession({
      product_id: productId,
      customer_email: user.email!,
      customer_name: user.user_metadata?.full_name,
      customer_external_id: user.id,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      metadata: {
        user_id: user.id,
        plan_type: plan_type,
      },
    });

    // Return the checkout URL
    return NextResponse.json({
      checkout_url: checkoutSession.url,
      checkout_id: checkoutSession.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
} 