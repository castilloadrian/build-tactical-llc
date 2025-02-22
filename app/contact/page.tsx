import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 animate-fade-in-up text-center">
        Contact <span className="text-blue-600">Build Tactical LLC</span>
      </h1>
      
      <div className="grid gap-8 max-w-2xl mx-auto animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] text-center">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Get in Touch</h2>
          <p className="text-lg text-slate-700">
            We're here to help you transform your contract data management. 
            Reach out to learn how we can support your business needs.
          </p>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Email</h3>
            <p className="text-lg text-blue-600">contact@buildtactical.com</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium">Phone</h3>
            <p className="text-lg text-blue-600">(555) 123-4567</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium">Business Hours</h3>
            <p className="text-lg text-slate-700">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
          </div>
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