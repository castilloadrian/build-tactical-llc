import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();

    // protected routes - require authentication
    const protectedRoutes = ["/dashboard", "/projects", "/project-proposals"];
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    // public routes that should be accessible to everyone
    const publicRoutes = ["/", "/pricing", "/sign-in", "/sign-up", "/contact", "/blog"];
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
    );
    
    if (isProtectedRoute && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Check subscription status for dashboard access
    if (isProtectedRoute && !user.error && user.data.user) {
      // Check if user has an active subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('status, plan_type, trial_expires_at, subscription_expires_at')
        .eq('user_id', user.data.user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error checking subscription status:', subscriptionError);
      }

      // If no active subscription found, redirect to pricing
      if (!subscription) {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      // Check if trial has expired
      if (subscription.plan_type === 'free-trial' && subscription.trial_expires_at) {
        const trialExpiresAt = new Date(subscription.trial_expires_at);
        const now = new Date();
        
        if (now > trialExpiresAt) {
          // Trial has expired, redirect to pricing
          return NextResponse.redirect(new URL("/pricing", request.url));
        }
      }

      // Check if paid subscription has expired
      if (subscription.subscription_expires_at) {
        const subscriptionExpiresAt = new Date(subscription.subscription_expires_at);
        const now = new Date();
        
        if (now > subscriptionExpiresAt) {
          // Subscription has expired, redirect to pricing
          return NextResponse.redirect(new URL("/pricing", request.url));
        }
      }
    }

    // Only redirect logged-in users from homepage to dashboard
    // Allow them to access other public routes like pricing
    if (request.nextUrl.pathname === "/" && !user.error) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
