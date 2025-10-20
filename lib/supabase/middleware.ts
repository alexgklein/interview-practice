import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log(`[Middleware] Processing request to: ${request.nextUrl.pathname}`)
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log(`[Middleware] User authenticated: ${!!user}`)
  console.log(`[Middleware] User ID: ${user?.id || 'null'}`)

  const publicPaths = ["/auth", "/library"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  
  console.log(`[Middleware] Is public path: ${isPublicPath}`)

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/library"
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/library"
    return NextResponse.redirect(url)
  }

  if (!user && !isPublicPath) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${request.nextUrl.pathname} to /auth/login`)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
