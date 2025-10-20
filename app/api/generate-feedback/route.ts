import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { attemptId, questionTitle, draft } = await request.json()

    const supabase = await createClient()

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Simulate transcript generation (in production, use speech-to-text API)
    const mockTranscript = `In my software engineering class, our team disagreed about which language to use for our project. As team lead, I needed to resolve this disagreement and keep the project on track. I scheduled a meeting where each person could present their case, and I facilitated a discussion about the pros and cons of each option. We evaluated based on our team's skills and project requirements. The conflict de-escalated, and we chose Python because it matched our team's strengths. We completed the project successfully and received an A grade.`

    // Generate AI feedback using the AI SDK
    const { generateText } = await import("ai")

    const draftContext = draft
      ? `
The user prepared this STAR draft:
Situation: ${draft.situation || "Not provided"}
Task: ${draft.task || "Not provided"}
Action: ${draft.action || "Not provided"}
Result: ${draft.result || "Not provided"}
`
      : ""

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are an expert interview coach evaluating a behavioral interview response.

Question: "${questionTitle}"

${draftContext}

Candidate's spoken response (transcript):
"${mockTranscript}"

Provide detailed feedback in the following JSON format:
{
  "overall": "A brief overall assessment (2-3 sentences)",
  "star": {
    "situation": "Feedback on the situation component",
    "task": "Feedback on the task component",
    "action": "Feedback on the action component",
    "result": "Feedback on the result component"
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

Focus on:
- STAR structure completeness
- Specificity and detail
- Relevance to the question
- Communication clarity
- Quantifiable results`,
    })

    // Parse the AI response
    let feedback
    try {
      feedback = JSON.parse(text)
    } catch {
      // Fallback if AI doesn't return valid JSON
      feedback = {
        overall:
          "Your response demonstrates good structure and addresses the question. Consider adding more specific details and quantifiable results.",
        star: {
          situation: "Clearly described the context and background",
          task: "Identified your responsibility as team lead",
          action: "Explained specific steps taken to resolve the conflict",
          result: "Mentioned positive outcome with grade received",
        },
        strengths: [
          "Clear STAR structure throughout the response",
          "Demonstrated leadership and conflict resolution skills",
          "Included a measurable outcome (A grade)",
        ],
        improvements: [
          "Add more specific details about the disagreement",
          "Elaborate on the facilitation techniques used",
          "Include more metrics about project success beyond the grade",
        ],
      }
    }

    // Update the attempt with transcript and feedback
    const { error: updateError } = await supabase
      .from("attempts")
      .update({
        transcript: mockTranscript,
        feedback: feedback,
      })
      .eq("id", attemptId)
      .eq("user_id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      transcript: mockTranscript,
      feedback: feedback,
    })
  } catch (error) {
    console.error("Error generating feedback:", error)
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 })
  }
}
