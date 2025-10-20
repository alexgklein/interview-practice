"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowLeft, Video, Square } from "lucide-react"
import { useToast } from '@/components/ui/use-toast'

type Question = {
  id: string
  title: string
  category: string
  difficulty: string | null
  description: string | null
}

type Draft = {
  id: string
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
} | null

export function StudioRecorder({ question, draft, userId }: { question: Question; draft: Draft; userId: string }) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showDraft, setShowDraft] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          }
        }
        setTranscript(prev => prev + finalTranscript)
      }
      
      recognitionRef.current.onerror = (event) => {
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access for speech recognition.",
            variant: "destructive",
          })
        }
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mimeType = [
        "video/webm;codecs=vp9",
        "video/webm", 
        "video/mp4"
      ].find(type => MediaRecorder.isTypeSupported(type)) || "video/webm"
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = URL.createObjectURL(blob)
          videoRef.current.load()
          videoRef.current.play().catch(() => {})
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript("")

      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Error",
        description: "Failed to access camera/microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const submitRecording = async () => {
    if (!recordedBlob) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data: attempt, error } = await supabase
        .from("attempts")
        .insert({
          user_id: userId,
          question_id: question.id,
          draft_id: draft?.id || null,
          duration: recordingTime,
          transcript: transcript.trim() || "No transcript available",
          feedback: null,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Recording submitted",
        description: "Your practice session has been saved with transcript.",
      })

      router.push(`/studio/${question.id}/review/${attempt.id}`)
    } catch (error) {
      console.error("Error submitting recording:", error)
      toast({
        title: "Error",
        description: "Failed to submit recording. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background container mx-auto px-6 py-8">
      {/* Main Content */}
      <div className="mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/studio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studio
          </Link>
        </Button>

        {/* Question Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">{question.title}</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">{question.category}</Badge>
            {question.difficulty && <Badge>{question.difficulty}</Badge>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Recording Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    controls={!isRecording && recordedBlob}
                    muted={isRecording}
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {formatTime(recordingTime)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Controls */}
            <div className="flex gap-4 justify-center">
              {!isRecording && !recordedBlob && (
                <Button onClick={startRecording} size="lg" className="gap-2">
                  <Video className="h-5 w-5" />
                  Start Recording
                </Button>
              )}
              {isRecording && (
                <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
                  <Square className="h-5 w-5" />
                  Stop Recording
                </Button>
              )}
              {recordedBlob && !isRecording && (
                <>
                  <Button onClick={startRecording} size="lg" variant="outline" className="gap-2 bg-transparent">
                    <Video className="h-5 w-5" />
                    Re-record
                  </Button>
                  <Button onClick={submitRecording} size="lg" disabled={isProcessing} className="gap-2">
                    {isProcessing ? "Saving..." : "Submit Recording"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Draft Reference */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your Draft</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDraft(!showDraft)}>
                {showDraft ? "Hide" : "Show"}
              </Button>
            </div>

            {showDraft && draft && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="space-y-4">
                  {draft.situation && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Situation</h4>
                      <p className="text-sm">{draft.situation}</p>
                    </div>
                  )}
                  {draft.situation && (draft.task || draft.action || draft.result) && (
                    <hr className="border-border" />
                  )}
                  {draft.task && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Task</h4>
                      <p className="text-sm">{draft.task}</p>
                    </div>
                  )}
                  {draft.task && (draft.action || draft.result) && (
                    <hr className="border-border" />
                  )}
                  {draft.action && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Action</h4>
                      <p className="text-sm">{draft.action}</p>
                    </div>
                  )}
                  {draft.action && draft.result && (
                    <hr className="border-border" />
                  )}
                  {draft.result && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Result</h4>
                      <p className="text-sm">{draft.result}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showDraft && !draft && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">No draft available for this question.</p>
                  <Button asChild variant="link" className="px-0 mt-2">
                    <Link href={`/workspace/${question.id}`}>Create a draft</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
