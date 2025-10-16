import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth for protected routes
  if (req.nextUrl.pathname.startsWith("/app") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify email domain
  if (session && !session.user.email?.endsWith("@inbound.no")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=invalid_domain", req.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*"],
};
