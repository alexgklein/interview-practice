import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceEditor } from "@/components/workspace-editor"

export default async function WorkspaceQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the question
  const { data: question } = await supabase.from("questions").select("*").eq("id", questionId).single()

  if (!question) {
    redirect("/library")
  }

  // Fetch existing draft if any
  const { data: draft } = await supabase
    .from("drafts")
    .select("*")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .single()

  return <WorkspaceEditor question={question} draft={draft} userId={user.id} />
}
