import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function WorkspacePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's drafts with question details
  const { data: drafts } = await supabase
    .from("drafts")
    .select("*, questions(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Drafts</h2>
          <p className="text-muted-foreground">Manage your STAR-formatted responses</p>
        </div>

        {drafts && drafts.length > 0 ? (
          <div className="grid gap-4">
            {drafts.map((draft: any) => (
              <Link
                key={draft.id}
                href={`/workspace/${draft.question_id}`}
                className="block p-6 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold mb-2">{draft.questions?.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {draft.situation || "No situation drafted yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(draft.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven&apos;t created any drafts yet.</p>
            <Button asChild>
              <Link href="/library">Browse Questions</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
