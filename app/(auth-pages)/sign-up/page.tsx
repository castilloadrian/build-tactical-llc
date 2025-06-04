import { signUpAction } from "@/app/actions";
import { FormMessage, type Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="border-border shadow-lg">
            <CardContent className="p-8">
              <FormMessage message={searchParams} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Join <span className="text-accent">Build Tactical</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Create your account to get started
          </p>
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
                    <option value="Organization">Organization</option>
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
                formAction={signUpAction as unknown as (formData: FormData) => Promise<void>} 
                pendingText="Creating account..."
                className="w-full bg-accent hover:bg-accent/90 text-white"
              >
                Create Account
              </SubmitButton>
              
              <FormMessage message={searchParams} />
              
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
  );
}
