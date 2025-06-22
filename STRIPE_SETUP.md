# Stripe Integration Setup Guide

This guide will help you set up Stripe integration for the pricing functionality.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Stripe Dashboard Setup

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Create Products and Prices**:
   - Go to Products in your Stripe Dashboard
   - Create a product for "Monthly Plan" with price $125/month
   - Create a product for "6-Month Prepaid Plan" with price $600
   - Note down the Price IDs (they start with `price_`)

3. **Update Price IDs**:
   - Open `app/pricing/page.tsx`
   - Replace the placeholder price IDs in the `plans` array:
     ```typescript
     stripePriceId: 'price_your_actual_monthly_price_id'
     stripePriceId: 'price_your_actual_six_month_price_id'
     ```

4. **Set up Webhooks**:
   - Go to Webhooks in your Stripe Dashboard
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the webhook signing secret to your environment variables

## Database Setup

You'll need to create a table to track user subscriptions. Here's an example SQL for Supabase:

```sql
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free-trial', 'monthly', 'six-month')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

## Testing

1. **Test Free Trial**: Log in and click "Start Free Trial" - should activate trial and redirect to dashboard
2. **Test Paid Plans**: Click on Monthly or 6-Month plan - should redirect to Stripe checkout
3. **Test Non-logged-in Flow**: Visit pricing page without logging in, select a plan - should redirect to sign-up

## Future Enhancements

When you're ready to implement full subscription management:

1. **Update `utils/subscription.ts`**: Implement actual database queries
2. **Add subscription status checks**: Hide pricing page for users with active subscriptions
3. **Add subscription management**: Allow users to cancel/upgrade subscriptions
4. **Add usage tracking**: Track feature usage for different plan types

## Troubleshooting

- **Check Stripe logs**: Monitor webhook events in Stripe Dashboard
- **Check browser console**: Look for JavaScript errors
- **Check server logs**: Monitor API route errors
- **Verify environment variables**: Ensure all Stripe keys are correct 