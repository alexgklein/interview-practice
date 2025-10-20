"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const NAV_ITEMS = [
  { label: "Library", href: "/library" },
  { label: "Workspace", href: "/workspace" },
  { label: "Studio", href: "/studio" },
]

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/library")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/library" className="text-lg font-semibold hover:opacity-80 transition-opacity">
            Interview Practice
          </Link>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/library" && pathname.startsWith(item.href))
              
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={`text-sm font-medium transition-colors ${
                    isActive 
                      ? "text-foreground bg-accent" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/sign-up">Register</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
