"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"
import { useToast } from '@/components/ui/use-toast'

type Question = {
  id: string
  title: string
  category: string
  difficulty: string | null
  description: string | null
  question_number: number | null
  example_situation: string | null
  example_task: string | null
  example_action: string | null
  example_result: string | null
  tags: string[] | null
}

type Draft = {
  id: string
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
} | null

export function WorkspaceEditor({ question, draft, userId }: { question: Question; draft: Draft; userId: string }) {
  const [situation, setSituation] = useState(draft?.situation || "")
  const [task, setTask] = useState(draft?.task || "")
  const [action, setAction] = useState(draft?.action || "")
  const [result, setResult] = useState(draft?.result || "")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      if (draft) {
        const { error } = await supabase
          .from("drafts")
          .update({
            situation,
            task,
            action,
            result,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draft.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("drafts").insert({
          user_id: userId,
          question_id: question.id,
          situation,
          task,
          action,
          result,
        })

        if (error) throw error
      }

      toast({
        title: "Draft saved",
        description: "Your response has been saved successfully.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] container mx-auto">
      {/* Left Panel - Question Description */}
      <div className="w-1/2 border-r border-border overflow-y-auto">
        <div className="p-6">
          {/* Question Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-3">
              {question.question_number}. {question.title}
            </h1>
            <div className="flex gap-2 mb-4">
              {question.difficulty && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${
                    question.difficulty === "Easy"
                      ? "text-green-500 border-green-500/50"
                      : question.difficulty === "Medium"
                        ? "text-yellow-500 border-yellow-500/50"
                        : "text-red-500 border-red-500/50"
                  }`}
                >
                  {question.difficulty}
                </Badge>
              )}
              <Badge variant="secondary">{question.category}</Badge>
              {question.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Question Description */}
          {question.description && (
            <div className="mb-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{question.description}</p>
            </div>
          )}

          {/* Example Responses */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Example Response:</h3>
            </div>

            {question.example_situation && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Situation</h4>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{question.example_situation}</p>
                </div>
              </div>
            )}

            {question.example_task && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Task</h4>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{question.example_task}</p>
                </div>
              </div>
            )}

            {question.example_action && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Action</h4>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{question.example_action}</p>
                </div>
              </div>
            )}

            {question.example_result && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Result</h4>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{question.example_result}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - STAR Response Editor */}
      <div className="w-1/2 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Your Response</h2>
          </div>

          <div className="space-y-6">
            {/* Situation */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Situation</label>
              <Textarea
                placeholder="Describe the context or background..."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Task */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Task</label>
              <Textarea
                placeholder="What was your responsibility or goal..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Action */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Action</label>
              <Textarea
                placeholder="What specific steps did you take..."
                value={action}
                onChange={(e) => setAction(e.target.value)}
                rows={6}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Result */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Result</label>
              <Textarea
                placeholder="What was the outcome..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
             <Button onClick={handleSave} disabled={isSaving} size="sm" className="cursor-pointer">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={`/studio/${question.id}`}>Practice</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
