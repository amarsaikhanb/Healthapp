import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * VAPI Webhook Handler
 * Receives call events and processes form answers using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // VAPI sends webhooks with message.type = 'end-of-call-report'
    const messageType = body.message?.type || body.event
    const call = body.call || body.message?.call

    // Handle call ended event
    if (messageType === 'end-of-call-report' || messageType === 'call-ended') {
      const metadata = call?.metadata
      const transcript = body.transcript || body.message?.transcript || body.message?.artifact?.transcript

      if (!metadata?.formId) {
        return NextResponse.json({ received: true })
      }

      if (!transcript) {
        console.error('No transcript found in webhook for form:', metadata.formId)
        return NextResponse.json({ received: true })
      }

      console.log(`Processing form ${metadata.formId} - extracting answers from transcript`)

      // Get form questions from database
      const { data: questions } = await supabase
        .from("question")
        .select("id, question_text, question_order")
        .eq("form_id", metadata.formId)
        .order("question_order", { ascending: true })

      if (!questions || questions.length === 0) {
        console.error('No questions found for form:', metadata.formId)
        return NextResponse.json({ received: true })
      }

      // Extract answers using OpenAI
      const answers = await extractAnswersWithAI(transcript, questions)

      if (answers && answers.length > 0) {
        // Save answers to database
        const answersData = answers.map((a) => ({
          form_id: metadata.formId,
          question_id: a.question_id,
          answer_text: a.answer_text,
        }))

        // Delete existing answers
        await supabase
          .from("answer")
          .delete()
          .eq("form_id", metadata.formId)

        // Insert new answers
        const { error: answersError } = await supabase
          .from("answer")
          .insert(answersData)

        if (answersError) {
          console.error('Failed to save answers:', answersError)
        } else {
          // Mark form as submitted
          await supabase
            .from("form")
            .update({ 
              submitted_at: new Date().toISOString(),
              submitted_via: "vapi_call",
              call_made_at: new Date().toISOString(),
              call_sid: call?.id || null
            })
            .eq("id", metadata.formId)

          console.log(`✓ Form ${metadata.formId} submitted via VAPI with ${answers.length} answers`)
        }
      } else {
        console.error('No answers extracted from transcript for form:', metadata.formId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('VAPI webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Extract answers from transcript using OpenAI
 */
async function extractAnswersWithAI(
  transcript: string,
  questions: Array<{ id: string; question_text: string; question_order: number }>
): Promise<Array<{ question_id: string; answer_text: string }>> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured')
    return []
  }

  try {
    // Build the prompt with questions
    const questionsText = questions
      .map((q, idx) => `${idx + 1}. ${q.question_text}`)
      .join('\n')

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical assistant extracting information from phone call transcripts. 
Your task is to extract the patient's answers to specific health questions from the conversation.

Return ONLY valid JSON in this exact format:
{
  "answers": [
    {
      "question_number": 1,
      "answer": "patient's answer here"
    }
  ]
}

Rules:
- Extract the patient's actual responses to each question
- If a question wasn't answered, use "Not answered" 
- Keep answers concise but complete
- Use the patient's own words when possible
- Return valid JSON only, no additional text`
          },
          {
            role: "user",
            content: `Call Transcript:
${transcript}

Questions to extract answers for:
${questionsText}

Extract the patient's answers to these questions from the transcript.`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return []
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content
    
    if (!content) {
      console.error('No content in OpenAI response')
      return []
    }

    const parsed = JSON.parse(content)
    const extractedAnswers = parsed.answers || []

    // Map back to question IDs
    const mappedAnswers = extractedAnswers
      .map((a: { question_number: number; answer: string }) => {
        const question = questions[a.question_number - 1]
        if (!question) return null
        
        return {
          question_id: question.id,
          answer_text: a.answer
        }
      })
      .filter((a): a is { question_id: string; answer_text: string } => 
        a !== null && a.answer_text !== "Not answered"
      )

    return mappedAnswers

  } catch (error) {
    console.error('Error extracting answers with AI:', error)
    return []
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "VAPI webhook endpoint",
    status: "active",
  })
}

