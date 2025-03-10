import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-tactical"></div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center relative z-10 py-24">
        <h1 className="text-5xl font-bold tracking-tight mb-6 animate-fade-in-up">
          Transform Your Contract Data into{" "}
          <span className="text-accent">Actionable Insights</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] [--animation-duration:800ms]">
          Build Tactical LLC helps you make sense of your data with powerful analytics,
          real-time synchronization of data, and enterprise-grade security.
        </p>
        <div className="flex gap-4 justify-center animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards] [--animation-duration:800ms]">
          <Link href="/learn-more">
            <Button size="lg">Learn More</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Contact Us</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
