import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <>
      {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center relative z-10 py-24">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Transform Your Contract Data into{" "}
            <span className="text-blue-600">Actionable Insights</span>
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Build Tactical LLC helps you make sense of your data with powerful analytics,
            real-time synchronization of data, and enterprise-grade security.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Learn More</Button>
            <Button size="lg" variant="outline">Contact Us</Button>
          </div>
        </div>
    </>
  );
}
