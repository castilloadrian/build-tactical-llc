'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatusProps {
  user: User;
}

export function SubscriptionStatus({ user }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setSubscription(data);
      } catch (error) {
        // No subscription found
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user.id, supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to unlock all premium features and get full access to the platform.
            </p>
            <Link href="/pricing">
              <Button className="bg-accent hover:bg-accent/90">
                View Plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Cancelling</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPlanName = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return 'Monthly Plan';
      case 'yearly':
        return 'Yearly Plan';
      case 'free_trial':
        return 'Free Trial';
      default:
        return planType;
    }
  };

  const currentPeriodEnd = new Date(subscription.current_period_end);
  const isExpiringSoon = currentPeriodEnd.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{formatPlanName(subscription.plan_type)}</h3>
            <p className="text-sm text-muted-foreground">
              {subscription.plan_type === 'monthly' ? '$150/month' : 
               subscription.plan_type === 'yearly' ? '$1,680/year' : 
               'Free'}
            </p>
          </div>
          {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>
            {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
            <span className={isExpiringSoon ? 'font-semibold text-orange-600' : 'font-semibold'}>
              {currentPeriodEnd.toLocaleDateString()}
            </span>
          </span>
        </div>

        {subscription.cancel_at_period_end && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Your subscription will end on {currentPeriodEnd.toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {isExpiringSoon && !subscription.cancel_at_period_end && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Your subscription will automatically renew
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <Link href="/contact">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 