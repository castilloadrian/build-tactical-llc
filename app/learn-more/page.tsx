import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Building2, BarChart3, Shield, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";

export default function LearnMore() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          About <span className="text-accent">Build Tactical LLC</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          We're transforming how contractors and government organizations connect, collaborate, and succeed together through innovative technology solutions.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-20 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-accent" />
                <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To bridge the gap between skilled contractors and government organizations by providing comprehensive directories, streamlined project management, and data-driven insights that foster successful partnerships.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center">
                <Building2 className="h-16 w-16 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-20 animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          What We <span className="text-accent">Offer</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Contractor Directory Card */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Contractor Directory</CardTitle>
              <CardDescription>
                Browse verified contractors with detailed profiles and expertise areas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Verified contractor profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Project portfolios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Skill-based filtering
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Government Directory Card */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Government Directory</CardTitle>
              <CardDescription>
                Explore government organizations and their projects and opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Organization profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Project Requests
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Contact information
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Analytics Dashboard Card */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Customizable Dashboard</CardTitle>
              <CardDescription>
                Create a personalized dashboard to track your projects and performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Project metrics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Performance tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Custom reports
                </li>
              </ul>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center animate-fade-in-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="bg-accent/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join contractors and government organizations who are already using Build Tactical LLC to streamline their project partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="w-full sm:w-auto">
                Sign Up Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 