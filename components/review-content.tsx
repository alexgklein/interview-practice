"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from '@/components/ui/use-toast'

type Attempt = {
  id: string
  transcript: string | null
  duration: number
  feedback: any
  questions: {
    id: string
    title: string
    category: string
    difficulty: string | null
  }
}

type Draft = {
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
} | null

export function ReviewContent({ attempt, draft }: { attempt: Attempt; draft: Draft }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [transcript, setTranscript] = useState(attempt.transcript)
  const [feedback, setFeedback] = useState(attempt.feedback)
  const { toast } = useToast()

  useEffect(() => {
    // If no transcript or feedback, generate them
    if (!attempt.transcript || !attempt.feedback) {
      generateFeedback()
    }
  }, [])

  const generateFeedback = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionTitle: attempt.questions.title,
          draft: draft,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate feedback")

      const data = await response.json()
      setTranscript(data.transcript)
      setFeedback(data.feedback)

      toast({
        title: "Feedback generated",
        description: "Your AI feedback is ready!",
      })
    } catch (error) {
      console.error("Error generating feedback:", error)
      toast({
        title: "Error",
        description: "Failed to generate feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/studio">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Studio
            </Link>
          </Button>

          {/* Question Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">{attempt.questions.title}</h2>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary">{attempt.questions.category}</Badge>
              {attempt.questions.difficulty && <Badge>{attempt.questions.difficulty}</Badge>}
              <span className="text-sm text-muted-foreground ml-2">Duration: {formatTime(attempt.duration)}</span>
            </div>
          </div>

          {isGenerating && (
            <Card className="mb-6">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Generating AI feedback...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isGenerating && (transcript || feedback) && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="feedback" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="feedback" className="space-y-4 mt-4">
                    {feedback && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>Overall Assessment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">
                              {feedback.overall || "No overall assessment available."}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>STAR Structure</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-1">Situation</h4>
                              <p className="text-sm text-muted-foreground">
                                {feedback.star?.situation || "Not clearly identified"}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Task</h4>
                              <p className="text-sm text-muted-foreground">
                                {feedback.star?.task || "Not clearly identified"}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Action</h4>
                              <p className="text-sm text-muted-foreground">
                                {feedback.star?.action || "Not clearly identified"}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Result</h4>
                              <p className="text-sm text-muted-foreground">
                                {feedback.star?.result || "Not clearly identified"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Strengths</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                              {feedback.strengths?.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              )) || <li>No strengths identified</li>}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Areas for Improvement</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                              {feedback.improvements?.map((improvement: string, i: number) => (
                                <li key={i}>{improvement}</li>
                              )) || <li>No improvements suggested</li>}
                            </ul>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="transcript" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {transcript || "Transcript not available"}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Draft Reference */}
              <div className="space-y-4">
                <h3 className="font-semibold">Your Draft</h3>
                {draft ? (
                  <div className="space-y-4">
                    {draft.situation && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-sm mb-2">Situation</h4>
                          <p className="text-sm text-muted-foreground">{draft.situation}</p>
                        </CardContent>
                      </Card>
                    )}
                    {draft.task && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-sm mb-2">Task</h4>
                          <p className="text-sm text-muted-foreground">{draft.task}</p>
                        </CardContent>
                      </Card>
                    )}
                    {draft.action && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-sm mb-2">Action</h4>
                          <p className="text-sm text-muted-foreground">{draft.action}</p>
                        </CardContent>
                      </Card>
                    )}
                    {draft.result && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-sm mb-2">Result</h4>
                          <p className="text-sm text-muted-foreground">{draft.result}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">No draft available for this question.</p>
                    </CardContent>
                  </Card>
                )}

                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href={`/workspace/${attempt.questions.id}`}>Edit Draft</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href={`/studio/${attempt.questions.id}`}>Practice Again</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
