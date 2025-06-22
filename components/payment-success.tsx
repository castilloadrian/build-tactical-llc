import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star } from "lucide-react";
import Link from "next/link";

interface PaymentSuccessProps {
  planName: string;
  isTrial?: boolean;
}

export function PaymentSuccess({ planName, isTrial = false }: PaymentSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            {isTrial ? 'Free Trial Activated!' : 'Payment Successful!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-lg text-green-700 mb-2">
              {isTrial 
                ? `Your 24-hour free trial for ${planName} has been activated!`
                : `Your ${planName} subscription has been activated!`
              }
            </p>
            <p className="text-muted-foreground">
              {isTrial 
                ? 'You now have full access to all features for the next 24 hours.'
                : 'You now have full access to all premium features.'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                View Plans
              </Button>
            </Link>
          </div>
          
          {isTrial && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Upgrade to Continue</span>
              </div>
              <p className="text-sm text-yellow-700">
                Your free trial expires in 24 hours. Upgrade to a paid plan to continue enjoying full access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 