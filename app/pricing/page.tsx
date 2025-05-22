"use client";
import { useState } from "react";

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  // Prices
  const proPrice = billing === "monthly" ? 20 : 16; // $16/mo yearly
  const businessPrice = billing === "monthly" ? 40 : 32; // $32/mo yearly
  const proLabel = billing === "monthly" ? "/month" : "/month";
  const businessLabel = billing === "monthly" ? "/month" : "/month";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-5xl font-bold mb-2 text-white text-center">Pricing</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">Choose the plan that works for you</p>

      {/* Toggle for Monthly/Yearly */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md bg-muted p-1">
          <button
            className={`px-4 py-1 rounded-md font-medium focus:outline-none transition-colors ${billing === "monthly" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            onClick={() => setBilling("monthly")}
          >
            MONTHLY
          </button>
          <button
            className={`px-4 py-1 rounded-md font-medium focus:outline-none transition-colors ${billing === "yearly" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            onClick={() => setBilling("yearly")}
          >
            YEARLY <span className="ml-1 text-xs">(SAVE 20%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Hobby Card */}
        <div className="rounded-2xl border border-muted bg-background p-8 flex flex-col items-center shadow-md">
          <div className="text-lg font-semibold mb-2">Hobby</div>
          <div className="text-4xl font-bold mb-1">Free</div>
          <div className="text-sm text-muted-foreground mb-6">Includes</div>
          <ul className="text-left text-sm space-y-2 mb-8 w-full min-h-[112px]">
            <li>✓ Pro two-week trial</li>
            <li>✓ 2000 completions</li>
            <li>✓ 50 slow requests</li>
          </ul>
          <button className="w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 border border-input shadow-sm">Get Started</button>
        </div>

        {/* Pro Card */}
        <div className="rounded-2xl border border-muted bg-background p-8 flex flex-col items-center shadow-md">
          <div className="text-lg font-semibold mb-2">Pro</div>
          <div className="text-4xl font-bold mb-1">
            ${proPrice} <span className="text-base font-normal">{proLabel}</span>
          </div>
          <div className="text-sm text-muted-foreground mb-6">Everything in Hobby, plus</div>
          <ul className="text-left text-sm space-y-2 mb-8 w-full min-h-[112px]">
            <li>✓ Unlimited completions</li>
            <li>✓ 500 requests per month</li>
            <li>✓ Unlimited slow requests <span title="No cap on slow requests">&#9432;</span></li>
            <li>✓ Max mode</li>
          </ul>
          <button className="w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 border border-input shadow-sm">Get Started</button>
        </div>

        {/* Business Card */}
        <div className="rounded-2xl border border-muted bg-background p-8 flex flex-col items-center shadow-md">
          <div className="text-lg font-semibold mb-2">Business</div>
          <div className="text-4xl font-bold mb-1">
            ${businessPrice} <span className="text-base font-normal">{businessLabel}</span>
          </div>
          <div className="text-sm text-muted-foreground mb-6">Everything in Pro, plus</div>
          <ul className="text-left text-sm space-y-2 mb-8 w-full min-h-[112px]">
            <li>✓ Enforce privacy mode org-wide</li>
            <li>✓ Centralized team billing</li>
            <li>✓ Admin dashboard with usage stats</li>
          </ul>
          <button className="w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 border border-input shadow-sm">Get Started</button>
        </div>
      </div>
    </div>
  );
} 