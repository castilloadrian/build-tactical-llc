"use client";
import { signUpAction } from "@/app/actions";
import { FormMessage, type Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Clock, Star, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const planIcons = {
  'free-trial': Clock,
  'monthly': Star,
  'six-month': Calendar
};

export default function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const searchParams = useSearchParams();
  const urlSearchParams = useSearchParams();
  const planParam = urlSearchParams.get('plan');
  const router = useRouter();
  
  // Get search params for messages
  const [message, setMessage] = useState<Message | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  useEffect(() => {
    const getSearchParams = async () => {
      const searchParamsData = await props.searchParams;
      setMessage(searchParamsData);
      // Show dialog if there's a message
      if (searchParamsData && ('success' in searchParamsData || 'error' in searchParamsData || 'message' in searchParamsData)) {
        setShowDialog(true);
      }
    };
    getSearchParams();
  }, [props.searchParams]);

  useEffect(() => {
    // Check if there's a plan stored in sessionStorage (from pricing page)
    const storedPlanId = sessionStorage.getItem('selectedPlanId');
    if (storedPlanId) {
      // Reconstruct the plan object from the stored ID
      const planNames = {
        'free-trial': 'One Day Free Access',
        'monthly': 'Monthly Plan',
        'six-month': '6-Month Prepaid Plan'
      };
      const planPrices = {
        'free-trial': 'Free',
        'monthly': '$125/month',
        'six-month': '$600'
      };
      const planDescriptions = {
        'free-trial': 'Try us for 24 hours',
        'monthly': 'Flexible monthly billing',
        'six-month': '$100/month - Pay in full'
      };
      
      setSelectedPlan({
        id: storedPlanId,
        name: planNames[storedPlanId as keyof typeof planNames] || 'Selected Plan',
        price: planPrices[storedPlanId as keyof typeof planPrices] || '',
        description: planDescriptions[storedPlanId as keyof typeof planDescriptions] || '',
        icon: planIcons[storedPlanId as keyof typeof planIcons] || Clock
      });
    } else if (planParam) {
      // If plan is in URL params, create a basic plan object
      const planNames = {
        'free-trial': 'One Day Free Access',
        'monthly': 'Monthly Plan',
        'six-month': '6-Month Prepaid Plan'
      };
      const planPrices = {
        'free-trial': 'Free',
        'monthly': '$125/month',
        'six-month': '$600'
      };
      const planDescriptions = {
        'free-trial': 'Try us for 24 hours',
        'monthly': 'Flexible monthly billing',
        'six-month': '$100/month - Pay in full'
      };
      
      setSelectedPlan({
        id: planParam,
        name: planNames[planParam as keyof typeof planNames] || 'Selected Plan',
        price: planPrices[planParam as keyof typeof planPrices] || '',
        description: planDescriptions[planParam as keyof typeof planDescriptions] || '',
        icon: planIcons[planParam as keyof typeof planIcons] || Clock
      });
    }
  }, [planParam]);

  const handleSignUp = async (formData: FormData) => {
    // Add the selected plan to the form data
    if (selectedPlan) {
      formData.append('selectedPlan', selectedPlan.id);
    }
    
    // Call the original sign up action
    await signUpAction(formData);
    
    // Clear the stored plan after successful sign up
    sessionStorage.removeItem('selectedPlanId');
  };

  // Get the icon component for the selected plan
  const IconComponent = selectedPlan?.icon || Clock;

  // Get dialog content based on message type
  const getDialogContent = () => {
    if (!message) return null;

    if ('success' in message) {
      return {
        icon: CheckCircle,
        iconColor: "text-green-600",
        title: "Account Created Successfully!",
        description: message.success,
        variant: "success" as const
      };
    }

    if ('error' in message) {
      return {
        icon: XCircle,
        iconColor: "text-red-600",
        title: "Sign Up Failed",
        description: message.error,
        variant: "error" as const
      };
    }

    if ('message' in message) {
      return {
        icon: AlertCircle,
        iconColor: "text-blue-600",
        title: "Notice",
        description: message.message,
        variant: "info" as const
      };
    }

    return null;
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Join <span className="text-accent">Build Tactical</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Create your account to get started
            </p>
            
            {/* Show selected plan if available */}
            {selectedPlan && (
              <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <IconComponent className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-foreground">{selectedPlan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.price} • {selectedPlan.description}
                </p>
              </div>
            )}
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <Input 
                      name="fullName" 
                      placeholder="John Doe" 
                      required 
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="org_proj" className="text-sm font-medium text-foreground">
                      Organization or Project
                    </Label>
                    <Input 
                      name="org_proj" 
                      placeholder="Your organization or project name" 
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input 
                      name="email" 
                      type="email"
                      placeholder="you@example.com" 
                      required 
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-foreground">
                      I am a
                    </Label>
                    <select 
                      name="role" 
                      id="role"
                      required 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                    >
                      <option value="">Select your role</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Organization">Government Organization</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <Input
                      type="password"
                      name="password"
                      placeholder="Your password"
                      minLength={6}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <SubmitButton 
                  formAction={handleSignUp as unknown as (formData: FormData) => Promise<void>} 
                  pendingText="Creating account..."
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  {selectedPlan ? `Create Account & Continue with ${selectedPlan.name}` : 'Create Account'}
                </SubmitButton>
                
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link className="text-accent font-medium hover:text-accent/80 transition-colors" href="/sign-in">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success/Error Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {dialogContent?.icon && (
                <dialogContent.icon className={`h-6 w-6 ${dialogContent.iconColor}`} />
              )}
              <AlertDialogTitle className="text-xl">
                {dialogContent?.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {dialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowDialog(false);
                // Redirect to sign-in page on success, stay on current page for errors
                if (dialogContent?.variant === 'success') {
                  router.push('/sign-in');
                }
              }}
              className={dialogContent?.variant === 'success' 
                ? "bg-green-600 hover:bg-green-700" 
                : dialogContent?.variant === 'error'
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {dialogContent?.variant === 'success' ? 'Continue' : 'Try Again'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
