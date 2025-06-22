import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { hasUserAccess, hasProjectProposalsAccess } from "@/utils/subscription";

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

    // Check access for protected routes
    if (isProtectedRoute && !user.error && user.data.user) {
      let hasAccess = false;
      
      // Project proposals require stricter access (subscription OR Org Owner with organizations)
      if (request.nextUrl.pathname.startsWith('/project-proposals')) {
        hasAccess = await hasProjectProposalsAccess(user.data.user.id);
        
        if (!hasAccess) {
          // Check if user is an Org Owner without organizations
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.data.user.id)
            .single();
          
          if (userData?.role === 'Org Owner') {
            // Org Owner without organizations - redirect to dashboard
            return NextResponse.redirect(new URL("/dashboard", request.url));
          } else {
            // Other users without access - redirect to pricing
            return NextResponse.redirect(new URL("/pricing", request.url));
          }
        }
      } else {
        // Dashboard and projects use general access (subscription OR Org Owner)
        hasAccess = await hasUserAccess(user.data.user.id);
        
        if (!hasAccess) {
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
