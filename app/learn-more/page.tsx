import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LearnMore() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 animate-fade-in-up text-center">
        Learn More About <span className="text-accent">Build Tactical LLC</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-2xl mx-auto text-center">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Our Mission</h2>
          <p className="text-lg text-slate-700">
            At Build Tactical LLC, we're committed to transforming complex contract data into clear, actionable insights. 
            Our platform empowers businesses to make informed decisions through advanced analytics and real-time data processing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Key Features</h2>
          <ul className="list-none text-lg text-slate-700 space-y-2">
            <li>Advanced Analytics Dashboard</li>
            <li>Real-time Data Synchronization</li>
            <li>Enterprise-grade Security</li>
            <li>Custom Reporting Tools</li>
            <li>API Integration Capabilities</li>
          </ul>
        </section>

        <div className="mt-8">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 