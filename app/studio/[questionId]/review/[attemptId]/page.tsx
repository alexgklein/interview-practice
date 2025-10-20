import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReviewContent } from "@/components/review-content"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ questionId: string; attemptId: string }>
}) {
  const { questionId, attemptId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the attempt with question details
  const { data: attempt } = await supabase
    .from("attempts")
    .select("*, questions(*)")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single()

  if (!attempt) {
    redirect("/studio")
  }

  // Fetch the draft if it exists
  const { data: draft } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", attempt.draft_id)
    .eq("user_id", user.id)
    .single()

  return <ReviewContent attempt={attempt} draft={draft} />
}
