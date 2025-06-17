import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Welcome to <span className="text-accent">Build Tactical</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form className="space-y-6">
              <div className="space-y-4">
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
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <Link
                      className="text-xs text-accent/80 hover:text-accent transition-colors"
                      href="/forgot-password"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Your password"
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <SubmitButton 
                pendingText="Signing in..." 
                formAction={signInAction}
                className="w-full bg-accent hover:bg-accent/90 text-white"
              >
                Sign In
              </SubmitButton>
              
              <FormMessage message={searchParams} />
              
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link className="text-accent font-medium hover:text-accent/80 transition-colors" href="/sign-up">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
