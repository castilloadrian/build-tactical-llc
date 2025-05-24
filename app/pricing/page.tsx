"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, Zap, Crown, Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Choose Your <span className="text-accent">Plan</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Select the perfect plan for your needs. From free trials to yearly subscriptions, 
          we have solutions that scale with your business.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        
        {/* 1 Day Free Card */}
        <Card className="border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">1 Day Trial</CardTitle>
            <div className="py-4">
              <div className="text-4xl font-bold text-foreground">Free</div>
              <p className="text-sm text-muted-foreground mt-2">Try us for 24 hours</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full access for 1 day</span>
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
                <span className="text-sm">Basic support</span>
              </li>
            </ul>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                Start Free Trial
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 7 Days $25 Card */}
        <Card className="border-accent hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full flex flex-col">
          {/* Popular Badge */}
          <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Popular
          </div>
          
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">7 Days</CardTitle>
            <div className="py-4">
              <div className="text-4xl font-bold text-foreground">
                $25
              </div>
              <p className="text-sm text-muted-foreground mt-2">Perfect for short projects</p>
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
                <span className="text-sm">All premium features</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Instant activation</span>
              </li>
            </ul>
            <Link href="/sign-up">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 6 Months Card */}
        <Card className="border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">6 Months</CardTitle>
            <div className="py-4">
              <div className="text-3xl font-bold text-foreground">
                $300<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">$1,800 total - Pay in full</p>
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
                <span className="text-sm">6 months full access</span>
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
                <span className="text-sm">Instant activation</span>
              </li>
            </ul>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                Choose 6 Months
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 1 Year Card */}
        <Card className="border-border hover:shadow-lg transition-all duration-300 relative h-full flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">1 Year</CardTitle>
            <div className="py-4">
              <div className="text-3xl font-bold text-foreground">
                $295<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">$3,540 total - Pay in full</p>
              <div className="mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Max Savings
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
                <span className="text-sm">Instant activation</span>
              </li>
            </ul>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full hover:bg-accent hover:text-white transition-colors">
                Choose 1 Year
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 