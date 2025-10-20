import { createClient } from "@/lib/supabase/server"
import { LibraryContent } from "@/components/library-content"

export default async function LibraryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all questions
  const { data: questions, error } = await supabase.from("questions").select("*").order("category", { ascending: true })

  if (error) {
    console.error("Error fetching questions:", error)
    return <div>Error loading questions</div>
  }

  return <LibraryContent questions={questions || []} />
}
