"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Users, BarChart3, Shield, CheckCircle, Target, Zap, Database, Globe, Clock, Award, TrendingUp } from "lucide-react";
import Link from "next/link";



// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=26.2034&longitude=-98.2300&current_weather=true&temperature_unit=fahrenheit"
        );
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (e) {
        setWeather(null);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  const codeToIcon = (code: number) => {
    switch (code) {
      case 0: return "☀️";
      case 1: return "🌤️";
      case 2: return "⛅";
      case 3: return "☁️";
      case 45:
      case 48: return "🌫️";
      case 51:
      case 53:
      case 55: return "🌦️";
      case 56:
      case 57: return "🧊🌦️";
      case 61:
      case 63:
      case 65: return "🌧️";
      case 66:
      case 67: return "🧊🌧️";
      case 71:
      case 73:
      case 75: return "🌨️";
      case 77: return "❄️";
      case 80:
      case 81:
      case 82: return "🌦️";
      case 85:
      case 86: return "🌨️";
      case 95: return "⛈️";
      case 96:
      case 99: return "⛈️🧊";
      default: return "🌎";
    }
  };
  
  const codeToText = (code: number) => {
    switch (code) {
      case 0: return "Clear sky";
      case 1: return "Mainly clear";
      case 2: return "Partly cloudy";
      case 3: return "Overcast";
      case 45: return "Fog";
      case 48: return "Depositing rime fog";
      case 51: return "Light drizzle";
      case 53: return "Drizzle";
      case 55: return "Dense drizzle";
      case 56: return "Light freezing drizzle";
      case 57: return "Freezing drizzle";
      case 61: return "Slight rain";
      case 63: return "Moderate rain";
      case 65: return "Heavy rain";
      case 66: return "Light freezing rain";
      case 67: return "Heavy freezing rain";
      case 71: return "Slight snow fall";
      case 73: return "Moderate snow fall";
      case 75: return "Heavy snow fall";
      case 77: return "Snow grains";
      case 80: return "Slight rain showers";
      case 81: return "Moderate rain showers";
      case 82: return "Violent rain showers";
      case 85: return "Slight snow showers";
      case 86: return "Heavy snow showers";
      case 95: return "Thunderstorm";
      case 96: return "Thunderstorm with slight hail";
      case 99: return "Thunderstorm with heavy hail";
      default: return "Unknown";
    }
  };

  return (
    <Card className="w-full sm:w-64 border-border hover:shadow-lg transition-shadow backdrop-blur-sm bg-background/80">
      <CardContent className="p-6 text-center">
        <div className="text-sm text-muted-foreground mb-3">McAllen, TX</div>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : weather ? (
          <>
            <div className="text-4xl mb-2">{codeToIcon(weather.weathercode)}</div>
            <div className="text-2xl font-bold mb-1 text-foreground">{weather.temperature}°F</div>
            <div className="text-sm text-muted-foreground">{codeToText(weather.weathercode)}</div>
          </>
        ) : (
          <div className="text-red-500 text-sm">Weather unavailable</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 min-h-[calc(100vh-200px)] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <Target className="w-4 h-4 mr-2" />
                Connecting Government & Industry
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 text-foreground leading-tight">
                Bridging Contractors and{" "}
                <span className="text-accent bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                  Local Government Projects
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
                Build Tactical LLC helps you make sense of your data with powerful analytics,
                real-time synchronization of data, and offers directories of contractors and government organizations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/learn-more">
                  <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto hover:bg-accent hover:text-white transition-colors border-accent/20">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <div className="transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-lg">
                <WeatherWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-accent/5 py-16 border-y border-accent/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="animate-fade-in-up [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  <AnimatedCounter end={100} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  <AnimatedCounter end={50} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Government Partners</div>
              </div>
              <div className="animate-fade-in-up [animation-delay:500ms] opacity-0 [animation-fill-mode:forwards]">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  <AnimatedCounter end={150} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Contractors</div>
              </div>
              <div className="animate-fade-in-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  <AnimatedCounter end={99} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up [animation-delay:700ms] opacity-0 [animation-fill-mode:forwards]">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Powerful Tools for <span className="text-accent">Project Success</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to connect, collaborate, and complete projects efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Real-time insights and data visualization to track project performance and identify opportunities.",
                delay: "800ms"
              },
              {
                icon: Database,
                title: "Data Synchronization",
                description: "Seamless real-time sync across all platforms ensuring everyone works with the latest information.",
                delay: "900ms"
              },
              {
                icon: Building2,
                title: "Contractor Directory",
                description: "Comprehensive database of qualified contractors with ratings, capabilities, and availability.",
                delay: "1000ms"
              },
              {
                icon: Globe,
                title: "Government Portal",
                description: "Direct connection to local government projects, requirements, and bidding opportunities.",
                delay: "1100ms"
              },
              {
                icon: Shield,
                title: "Secure Platform",
                description: "Enterprise-grade security and compliance to protect sensitive project and bidding information.",
                delay: "1200ms"
              },
              {
                icon: Zap,
                title: "Reliable Data",
                description: "Real time data managed by the government organizations and contractors",
                delay: "1300ms"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className={`group border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up [animation-delay:${feature.delay}] opacity-0 [animation-fill-mode:forwards] backdrop-blur-sm bg-background/80`}
              >
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-accent/5 to-accent/10 py-20 border-y border-accent/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-up [animation-delay:1400ms] opacity-0 [animation-fill-mode:forwards]">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                  Why Choose <span className="text-accent">Build Tactical</span>?
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      icon: Clock,
                      title: "Save Time",
                      description: "Streamlined processes reduce project setup time by up to 70%"
                    },
                    {
                      icon: TrendingUp,
                      title: "Increase Success Rate",
                      description: "Data-driven matching improves project completion rates significantly"
                    },
                    {
                      icon: Award,
                      title: "Quality Assurance",
                      description: "Vetted contractors and comprehensive project tracking ensure quality outcomes"
                    }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="animate-fade-in-up [animation-delay:1500ms] opacity-0 [animation-fill-mode:forwards]">
                <div className="bg-gradient-to-br from-background/80 to-background/60 p-8 rounded-2xl backdrop-blur-sm border border-accent/20">
                  <h3 className="text-xl font-semibold mb-6 text-foreground">Ready to Get Started?</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">Free consultation available</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">No setup fees or hidden costs</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">24/7 support and training</span>
                    </div>
                  </div>
                  <Link href="/contact" className="block mt-6">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                      Schedule a Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 max-w-7xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up [animation-delay:1600ms] opacity-0 [animation-fill-mode:forwards]">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready to Transform Your Project Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of contractors and government organizations already using Build Tactical
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all">
                  View Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/learn-more">
                <Button variant="outline" size="lg" className="hover:bg-accent hover:text-white transition-colors border-accent/20">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
