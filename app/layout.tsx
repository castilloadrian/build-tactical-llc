import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Navigation } from "@/components/navigation";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { shouldShowPricingPage, hasUserAccess } from "@/utils/subscription";
import { Toaster } from 'sonner'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Build Tactical LLC",
  description: "Build Tactical LLC is a platform for data analysis and visualization",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user should see pricing page
  let showPricing = true;
  let hasActiveSubscription = false;
  let userRole = null;
  
  if (user) {
    showPricing = await shouldShowPricingPage(user.id);
    
    // Check if user has access for dashboard access (subscription OR Org Owner with organizations)
    hasActiveSubscription = await hasUserAccess(user.id);
    
    // Get user role to determine if pricing should be shown
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    userRole = userData?.role;
  }

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-20 items-center">
              <nav className="w-full flex justify-center h-16">
                <div className="w-full max-w-5xl flex items-center p-3 px-5 text-sm">
                  {/* Logo - Left */}
                  <div className="flex items-center font-semibold text-accent">
                    <Link href={"/"} className="flex items-center">
                      <Image
                        src="/build-tactical-llc-logo.png"
                        alt="Build Tactical LLC Logo"
                        width={32}
                        height={32}
                        className="mr-2"
                      />
                      Build Tactical LLC
                    </Link>
                  </div>
                  
                  {/* Navigation Links - Center */}
                  <div className="flex-1 flex justify-center items-center gap-4">
                    { user && hasActiveSubscription && (
                      <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-semibold">Dashboard</Link>
                    )}
                    <Link href="/contractor-directory" className="text-muted-foreground hover:text-foreground transition-colors">Contractor Directory</Link>
                    <Link href="/organization-directory" className="text-muted-foreground hover:text-foreground transition-colors">Organization Directory</Link>
                    <Link href="/learn-more" className="text-muted-foreground hover:text-foreground transition-colors">Learn More</Link>
                    <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
                    {showPricing && userRole !== 'Org Owner' && (
                      <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                    )}
                    <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                  </div>
                  
                  {/* User Navigation - Right */}
                  <div className="flex items-center gap-4">
                    <Navigation user={user} />
                  </div>
                </div>
              </nav>
              <div className="flex flex-col gap-20 max-w-5xl p-5">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center mx-auto text-center text-xs gap-8 py-16">
                <p>
                  2025 Build Tactical LLC. All rights reserved.
                </p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
