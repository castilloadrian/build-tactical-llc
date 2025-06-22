"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Star, Zap, Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { activateFreeTrial, hasUserHadFreeTrial } from "@/utils/subscription";

// Define plan types
type PlanType = 'free-trial' | 'monthly' | 'six-month';

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  bestValue?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  stripePriceId?: string; // For future Stripe integration
}

const plans: Plan[] = [
  {
    id: 'free-trial',
    name: 'One Day Free Access',
    price: 'Free',
    description: 'Try us for 24 hours',
    features: [
      'Full access for 1 day',
      'All features included',
      'No credit card required',
      'Basic support'
    ],
    buttonText: 'Start Free Trial',
    icon: Clock
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$125',
    description: 'Flexible monthly billing',
    features: [
      'Full access every month',
      'All premium features',
      'Priority support',
      'Cancel anytime'
    ],
    buttonText: 'Get Started',
    popular: true,
    icon: Star,
    stripePriceId: 'price_1RcsDfR9SQjspoGcqaWrTBiV'
  },
  {
    id: 'six-month',
    name: '6-Month Prepaid',
    price: '$600',
    description: '$100/month - Pay in full',
    features: [
      '6 months full access',
      'All premium features',
      'Priority support',
      'Save $150 vs monthly'
    ],
    buttonText: 'Choose 6-Month Plan',
    bestValue: true,
    icon: Calendar,
    stripePriceId: 'price_1RcsLDR9SQjspoGcP6zpBvPc'
  }
];

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState<Plan | null>(null);
  const [hasHadTrial, setHasHadTrial] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // If user is logged in, check if they've had a free trial
        if (user) {
          const trialUsed = await hasUserHadFreeTrial(user.id);
          setHasHadTrial(trialUsed);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth]);

  const handlePlanSelection = async (plan: Plan) => {
    setSelectedPlan(plan.id);
    
    // If user is not logged in, redirect to sign-up with plan info
    if (!user) {
      // Store only the plan ID in sessionStorage for after sign-up
      sessionStorage.setItem('selectedPlanId', plan.id);
      router.push(`/sign-up?plan=${plan.id}`);
      return;
    }

    // If user is logged in, handle the plan selection
    // For now, we'll redirect to a checkout page or handle payment
    // This will be expanded when Stripe integration is complete
    if (plan.id === 'free-trial') {
      // Handle free trial activation
      await handleFreeTrial();
    } else {
      // Handle paid plan selection
      await handlePaidPlan(plan);
    }
  };

  const handleFreeTrial = async () => {
    try {
      // Activate free trial using the utility function
      const success = await activateFreeTrial(user.id);
      
      if (success) {
        // Find the plan details for the success message
        const plan = plans.find(p => p.id === 'free-trial');
        setSuccessPlan(plan || null);
        setShowSuccess(true);
      } else {
        throw new Error('Failed to activate free trial');
      }
    } catch (error) {
      console.error('Error activating free trial:', error);
      alert('There was an error activating your free trial. Please try again.');
    }
  };

  const handlePaidPlan = async (plan: Plan) => {
    try {
      // Create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: plan.stripePriceId, 
          userId: user.id 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error handling paid plan:', error);
      alert('There was an error processing your request. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-green-800">
                  Free Trial Activated!
                </DialogTitle>
                <DialogDescription className="text-green-700">
                  You now have 24 hours of full access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Your free trial for <strong>{successPlan?.name}</strong> has been activated successfully!
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Trial Expires Soon</span>
              </div>
              <p className="text-sm text-yellow-700">
                Your free trial expires in 24 hours. Upgrade to a paid plan to continue enjoying full access.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSuccessClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSuccess(false)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Stay on Pricing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Choose Your <span className="text-accent">Plan</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Select the perfect plan for your needs. From free trials to monthly subscriptions, 
          we have solutions that scale with your business.
        </p>
        {user && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
            <p className="text-green-800">
              Welcome back, {user.email}! You're logged in and ready to upgrade.
            </p>
          </div>
        )}
        {user && hasHadTrial && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
            <p className="text-blue-800">
              You've already used your free trial. Choose a paid plan to continue enjoying our services.
            </p>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className={`grid gap-6 max-w-7xl mx-auto animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards] ${
        plans.filter(plan => !(plan.id === 'free-trial' && hasHadTrial)).length === 2
          ? 'grid-cols-1 lg:grid-cols-2 lg:max-w-4xl'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        
        {plans
          .filter(plan => {
            // Hide free trial if user has already had one
            if (plan.id === 'free-trial' && hasHadTrial) {
              return false;
            }
            return true;
          })
          .map((plan) => {
          const IconComponent = plan.icon;
          return (
            <Card 
              key={plan.id}
              className={`border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col ${
                plan.popular ? 'border-accent hover:shadow-xl' : ''
              } ${selectedPlan === plan.id ? 'ring-2 ring-accent' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Popular
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="py-4">
                  <div className="text-4xl font-bold text-foreground">
                    {plan.price}
                    {plan.id !== 'free-trial' && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {plan.id === 'monthly' ? '/month' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  {plan.bestValue && (
                    <div className="mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Best Value
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handlePlanSelection(plan)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full transition-colors ${
                    plan.popular 
                      ? 'bg-accent hover:bg-accent/90 text-white' 
                      : 'variant-outline hover:bg-accent hover:text-white'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Processing...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 