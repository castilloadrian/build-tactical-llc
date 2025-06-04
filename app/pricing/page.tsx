"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, Zap, Crown, Users, Calendar, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function Pricing() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // If user is logged in, check their subscription status
      if (user) {
        await checkUserSubscription(user.id);
      }
      
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const checkUserSubscription = async (userId: string) => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      setUserSubscription(subscription);
    } catch (error) {
      // No active subscription found, which is fine
      setUserSubscription(null);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setCheckoutLoading(planType);

    try {
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_type: planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Polar checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getSubscriptionStatus = () => {
    if (!userSubscription) return null;
    
    return {
      plan: userSubscription.plan_type,
      status: userSubscription.status,
      cancelAtPeriodEnd: userSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(userSubscription.current_period_end),
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Choose Your <span className="text-accent">Plan</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {user ? 
            subscriptionStatus ? 
              `You're currently on the ${subscriptionStatus.plan} plan. ${subscriptionStatus.cancelAtPeriodEnd ? 'Your subscription will end on ' + subscriptionStatus.currentPeriodEnd.toLocaleDateString() : 'Manage your subscription below.'}` :
              "Select the perfect plan for your needs. Start with our free trial and choose the subscription that fits your business." :
            "Select the perfect plan for your needs. Start with our free trial and choose the subscription that fits your business."
          }
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        
        {/* 7 Day Free Trial */}
        <Card className="border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">7 Day Free Trial</CardTitle>
            <div className="py-4">
              <div className="text-4xl font-bold text-foreground">Free</div>
              <p className="text-sm text-muted-foreground mt-2">Try us for 7 days</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full access for 7 days</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">All features included</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">No credit card required</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full support</span>
              </li>
            </ul>
            {!user && !loading && (
              <Link href="/sign-up">
                <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                  Start Free Trial
                </Button>
              </Link>
            )}
            {user && !loading && !subscriptionStatus && (
              <Link href="/sign-up">
                <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                  Start Free Trial
                </Button>
              </Link>
            )}
            {user && subscriptionStatus && (
              <Button variant="outline" className="w-full cursor-default opacity-50" disabled>
                {subscriptionStatus.plan === 'free_trial' ? 'Current Plan' : 'Contact Support'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Monthly Plan */}
        <Card className={`border-accent hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full flex flex-col ${subscriptionStatus?.plan === 'monthly' ? 'ring-2 ring-accent' : ''}`}>
          {/* Popular Badge */}
          <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            {subscriptionStatus?.plan === 'monthly' ? 'Current Plan' : 'Popular'}
          </div>
          
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Monthly</CardTitle>
            <div className="py-4">
              <div className="text-4xl font-bold text-foreground">
                $150
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Perfect for ongoing projects</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full platform access</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">All premium features</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Cancel anytime</span>
              </li>
            </ul>
            {!user && !loading && (
              <Link href="/sign-up">
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                  Get Started
                </Button>
              </Link>
            )}
            {user && !loading && !subscriptionStatus && (
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-white"
                onClick={() => handleSubscribe('monthly')}
                disabled={checkoutLoading === 'monthly'}
              >
                {checkoutLoading === 'monthly' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Monthly'
                )}
              </Button>
            )}
            {user && subscriptionStatus && subscriptionStatus.plan === 'monthly' && (
              <Button className="w-full cursor-default opacity-50" disabled>
                Current Plan
              </Button>
            )}
            {user && subscriptionStatus && subscriptionStatus.plan !== 'monthly' && (
              <Link href="/contact">
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                  Contact Support
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card className={`border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col ${subscriptionStatus?.plan === 'yearly' ? 'ring-2 ring-accent' : ''}`}>
          {subscriptionStatus?.plan === 'yearly' && (
            <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Current Plan
            </div>
          )}
          
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Yearly</CardTitle>
            <div className="py-4">
              <div className="text-3xl font-bold text-foreground">
                $1,680<span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">$140/month - Save $120/year</p>
              <div className="mt-2">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Best Value
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full year access</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">All premium features</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Save $120 per year</span>
              </li>
            </ul>
            {!user && !loading && (
              <Link href="/sign-up">
                <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                  Choose Yearly
                </Button>
              </Link>
            )}
            {user && !loading && !subscriptionStatus && (
              <Button 
                variant="outline" 
                className="w-full hover:bg-accent hover:text-white transition-colors"
                onClick={() => handleSubscribe('yearly')}
                disabled={checkoutLoading === 'yearly'}
              >
                {checkoutLoading === 'yearly' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Yearly'
                )}
              </Button>
            )}
            {user && subscriptionStatus && subscriptionStatus.plan === 'yearly' && (
              <Button variant="outline" className="w-full cursor-default opacity-50" disabled>
                Current Plan
              </Button>
            )}
            {user && subscriptionStatus && subscriptionStatus.plan !== 'yearly' && (
              <Link href="/contact">
                <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                  Contact Support
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact section for logged-in users */}
      {user && (
        <div className="text-center mt-16 animate-fade-in-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="bg-accent/5 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {subscriptionStatus ? 'Manage Your Subscription' : 'Need Help?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {subscriptionStatus 
                ? 'Need to make changes to your subscription? Our support team is here to help.'
                : 'Contact our support team for any questions about our plans or to get started.'
              }
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 