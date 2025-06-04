# Polar Integration Setup Guide

This guide will help you set up Polar as your payment processor for subscriptions in your Next.js application.

## Prerequisites

1. A Polar account (sign up at [polar.sh](https://polar.sh))
2. A Supabase project with authentication set up
3. Your application deployed or accessible via a public URL for webhooks

## Step 1: Polar Dashboard Setup

### 1.1 Create Products in Polar Dashboard

1. Log into your Polar dashboard
2. Navigate to **Products**
3. Create two products:
   - **Monthly Plan**: $140/month recurring
   - **Yearly Plan**: $1,680/year recurring
4. Copy the Product IDs for each plan

### 1.2 Get API Credentials

1. Go to **Settings** > **API Keys**
2. Create a new API key with the following scopes:
   - `checkouts:write`
   - `subscriptions:read`
   - `subscriptions:write`
3. Copy your Access Token

### 1.3 Set Up Webhooks

1. Go to **Settings** > **Webhooks**
2. Create a new webhook endpoint: `https://yourdomain.com/api/polar/webhooks`
3. Select these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.revoked`
   - `order.created`
4. Copy the Webhook Secret

## Step 2: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_MONTHLY_PRODUCT_ID=
POLAR_YEARLY_PRODUCT_ID=

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Database Setup

### 3.1 Create Subscriptions Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_subscription_id TEXT NOT NULL UNIQUE,
  polar_product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free_trial', 'monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_polar_id ON subscriptions(polar_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

```

## Step 4: Testing the Integration

### 4.1 Test Checkout Flow

1. Sign in to your application
2. Go to the pricing page (`/pricing`)
3. Click on "Subscribe Monthly" or "Subscribe Yearly"
4. Complete the checkout process in Polar
5. Verify the subscription appears in your Supabase database

### 4.2 Test Webhook Events

1. Use Polar's webhook testing tools or create a test subscription
2. Check your application logs to ensure webhooks are being received
3. Verify subscription data is being updated in Supabase

## Step 5: Production Deployment

### 5.1 Update Webhook URL

1. Update your webhook endpoint in Polar dashboard to your production URL
2. Ensure your production environment has all the required environment variables

### 5.2 Security Considerations

1. Keep your Polar Access Token and Webhook Secret secure
2. Use environment variables, never commit secrets to version control
3. Ensure your webhook endpoint validates the signature properly

## Features Included

### ✅ Implemented Features

- **Checkout Integration**: Create Polar checkout sessions for monthly/yearly plans
- **Webhook Handling**: Process subscription events from Polar
- **Database Sync**: Store and update subscription data in Supabase
- **Pricing Page**: Updated with Polar integration and subscription status
- **Subscription Status**: Component to display current subscription info
- **User Authentication**: Integration with existing Supabase auth

### 🔄 Subscription Lifecycle

1. **User subscribes** → Polar checkout → Webhook creates subscription in DB
2. **Subscription updates** → Webhook updates subscription in DB
3. **Subscription cancellation** → Webhook marks subscription as cancelled
4. **Subscription expiration** → Webhook marks subscription as expired

## API Endpoints

- `POST /api/polar/checkout` - Create checkout session
- `POST /api/polar/webhooks` - Handle Polar webhook events

## Components

- `SubscriptionStatus` - Display user's subscription information
- Updated `Pricing` page with Polar integration

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is publicly accessible
   - Verify webhook secret matches
   - Check Polar dashboard webhook logs

2. **Checkout not working**
   - Verify Product IDs are correct
   - Check Access Token permissions
   - Ensure user is authenticated

3. **Database errors**
   - Verify subscriptions table exists
   - Check RLS policies are correct
   - Ensure user has proper permissions

### Debug Mode

Enable debug logging by adding to your environment:

```bash
POLAR_DEBUG=true
```

## Support

For Polar-specific issues, check:
- [Polar Documentation](https://docs.polar.sh)
- [Polar Discord](https://discord.gg/polar)
- [Polar GitHub](https://github.com/polarsource/polar)

For application-specific issues, check your application logs and Supabase dashboard. 