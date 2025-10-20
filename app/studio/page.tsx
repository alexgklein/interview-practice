import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StudioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's attempts with question details
  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, questions(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Practice Sessions</h2>
          <p className="text-muted-foreground">Review your recorded attempts and feedback</p>
        </div>

        {attempts && attempts.length > 0 ? (
          <div className="grid gap-4">
            {attempts.map((attempt: any) => (
              <Link
                key={attempt.id}
                href={`/studio/${attempt.question_id}/review/${attempt.id}`}
                className="block p-6 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold mb-2">{attempt.questions?.title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>
                    Duration: {Math.floor((attempt.duration || 0) / 60)}:
                    {String((attempt.duration || 0) % 60).padStart(2, "0")}
                  </span>
                  <span>Recorded: {new Date(attempt.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven&apos;t recorded any practice sessions yet.</p>
            <Button asChild>
              <Link href="/library">Start Practicing</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
