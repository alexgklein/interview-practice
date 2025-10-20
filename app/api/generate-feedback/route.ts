import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { attemptId, questionTitle, draft } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: attemptData, error: attemptError } = await supabase
      .from("attempts")
      .select("transcript")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single()

    if (attemptError) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    const transcript = attemptData?.transcript || "No transcript available"

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const draftContext = draft
      ? `
The user prepared this STAR draft:
Situation: ${draft.situation || "Not provided"}
Task: ${draft.task || "Not provided"}
Action: ${draft.action || "Not provided"}
Result: ${draft.result || "Not provided"}
`
      : ""

    const prompt = `You are an expert interview coach evaluating a behavioral interview response.

Question: "${questionTitle}"

${draftContext}

Candidate's spoken response (transcript):
"${transcript}"

Provide detailed feedback in the following JSON format. IMPORTANT: Do not use any markdown formatting, asterisks, bold text, or special characters. Use plain text only:
{
  "overall": "A brief overall assessment (2-3 sentences)",
  "star": {
    "situation": "Feedback on the situation component",
    "task": "Feedback on the task component",
    "action": "Feedback on the action component",
    "result": "Feedback on the result component"
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": {
    "specificity": "Feedback about adding more specific details and examples",
    "quantification": "Feedback about including numbers, metrics, and measurable results",
    "structure": "Feedback about STAR structure and organization",
    "relevance": "Feedback about staying focused on the question asked",
    "communication": "Feedback about clarity and articulation"
  }
}

Focus on:
- STAR structure completeness
- Specificity and detail
- Relevance to the question
- Communication clarity
- Quantifiable results

Return only valid JSON with no markdown formatting, no asterisks, no bold text, and no special characters.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let feedback
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      feedback = JSON.parse(jsonString)
    } catch (error) {
      feedback = {
        overall: "Your response shows good effort. Consider adding more specific details and quantifiable results.",
        star: {
          situation: "Context could be more specific",
          task: "Your role and responsibilities were mentioned",
          action: "Steps taken were described",
          result: "Outcome was mentioned",
        },
        strengths: [
          "Attempted to follow STAR structure",
          "Addressed the question asked",
        ],
        improvements: {
          specificity: "Add more specific details and examples",
          quantification: "Include quantifiable results and metrics",
          structure: "Better organize your response using STAR format",
          relevance: "Stay focused on the specific question asked",
          communication: "Speak more clearly and avoid filler words"
        },
      }
    }

    const { error: updateError } = await supabase
      .from("attempts")
      .update({
        feedback: feedback,
      })
      .eq("id", attemptId)
      .eq("user_id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      transcript: transcript,
      feedback: feedback,
    })
  } catch (error) {
    console.error("Error generating feedback:", error)
    return NextResponse.json({ 
      error: "Failed to generate feedback", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
