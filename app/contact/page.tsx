'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import emailjs from '@emailjs/browser';
import { Toaster, toast } from 'sonner';
import { Mail, MapPin, Phone, Clock, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    
    try {
      await emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        form,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      toast.success("Message sent successfully!");
      form.reset();
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Toaster richColors />
      
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Get in <span className="text-accent">Touch</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        
        {/* Contact Form */}
        <div className="animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you shortly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="from_name"
                      required
                      className="border-border focus:border-accent transition-colors"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="reply_to"
                      type="email"
                      required
                      className="border-border focus:border-accent transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    className="border-border focus:border-accent transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    className="min-h-[150px] border-border focus:border-accent transition-colors resize-none"
                    placeholder="Tell us about your project or questions..."
                  />
                </div>

                <input 
                  type="hidden" 
                  name="to_name" 
                  value="Build Tactical LLC" 
                />

                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-8 animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
          
          {/* Contact Info Card */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                Contact Information
              </CardTitle>
              <CardDescription>
                Multiple ways to reach our team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="text-muted-foreground">jt@buildtacticaldashboards.com</p>
                  <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <p className="text-muted-foreground">+1 (956) 325-6678</p>
                  <p className="text-sm text-muted-foreground">Mon-Sun, 9 AM - 6 PM CT</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <p className="text-muted-foreground">McAllen, TX</p>
                  <p className="text-sm text-muted-foreground">Serving government contractors nationwide</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Card */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Sunday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM CT</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 