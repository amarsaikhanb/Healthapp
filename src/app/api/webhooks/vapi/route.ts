import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * VAPI Webhook Handler
 * Receives call events and processes form answers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('VAPI Webhook received:', body)

    const { event, call } = body

    // Handle call ended event
    if (event === 'call-ended' || event === 'end-of-call-report') {
      const { metadata, transcript, messages } = call

      if (!metadata?.formId) {
        console.log('No formId in metadata, skipping')
        return NextResponse.json({ received: true })
      }

      // Extract answers from conversation
      const answers = extractAnswersFromTranscript(
        messages || [],
        metadata.questions || []
      )

      if (answers.length > 0) {
        // Save answers to database
        const answersData = answers.map((a: any) => ({
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
              submitted_via: "vapi_call"
            })
            .eq("id", metadata.formId)

          console.log(`Form ${metadata.formId} submitted via VAPI call`)
        }
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
 * Extract answers from conversation transcript
 * This is a simple implementation - can be enhanced with AI
 */
function extractAnswersFromTranscript(
  messages: Array<{ role: string; content: string }>,
  questions: Array<{ id: string; text: string }>
): Array<{ question_id: string; answer_text: string }> {
  const answers: Array<{ question_id: string; answer_text: string }> = []

  // Group consecutive messages
  let currentQuestionIndex = 0
  let collectingAnswer = false
  let currentAnswer = ''

  for (const message of messages) {
    if (message.role === 'assistant') {
      // Check if this message contains a question
      const containsQuestion = questions.some(q =>
        message.content.toLowerCase().includes(q.text.toLowerCase().slice(0, 20))
      )

      if (containsQuestion && currentAnswer && currentQuestionIndex < questions.length) {
        // Save previous answer
        answers.push({
          question_id: questions[currentQuestionIndex - 1]?.id,
          answer_text: currentAnswer.trim(),
        })
        currentAnswer = ''
        currentQuestionIndex++
      }

      collectingAnswer = containsQuestion
    } else if (message.role === 'user' && collectingAnswer) {
      // Collect user response
      currentAnswer += ' ' + message.content
    }
  }

  // Save last answer
  if (currentAnswer && currentQuestionIndex < questions.length) {
    answers.push({
      question_id: questions[currentQuestionIndex]?.id,
      answer_text: currentAnswer.trim(),
    })
  }

  return answers.filter(a => a.question_id && a.answer_text)
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "VAPI webhook endpoint",
    status: "active",
  })
}

