import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * VAPI callback endpoint to submit form answers
 * Called by VAPI after collecting answers from patient via phone call
 * 
 * VAPI sends webhooks with message.type = "function-call" or similar
 * We extract the answers from the message content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("Received VAPI webhook:", JSON.stringify(body, null, 2))

    // Extract formId from call metadata
    const formId = body.call?.metadata?.formId || body.metadata?.formId || body.formId

    if (!formId) {
      console.error("No formId in webhook:", body)
      return NextResponse.json(
        { error: "formId is required" },
        { status: 400 }
      )
    }

    // Try to extract answers from various VAPI webhook formats
    let answers = body.answers || body.message?.content?.answers || body.data?.answers

    // If answers are in a string format, try to parse them
    if (typeof answers === 'string') {
      try {
        const parsed = JSON.parse(answers)
        answers = parsed.answers || parsed
      } catch (e) {
        console.error("Failed to parse answers string:", e)
      }
    }

    if (!answers || !Array.isArray(answers)) {
      console.error("No valid answers array found in webhook:", body)
      return NextResponse.json(
        { error: "answers array is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify form exists and is not yet submitted
    const { data: form, error: formError } = await supabase
      .from("form")
      .select("id, submitted_at, patient_id, doctor_id")
      .eq("id", formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      )
    }

    if (form.submitted_at) {
      console.log(`Form ${formId} already submitted`)
      return NextResponse.json({
        success: true,
        message: "Form already submitted",
      })
    }

    // Delete existing answers (if any)
    await supabase.from("answer").delete().eq("form_id", formId)

    // Insert new answers from VAPI call
    const answersData = answers
      .filter((a: any) => a.question_id && a.answer_text)
      .map((a: any) => ({
        form_id: formId,
        question_id: a.question_id,
        answer_text: a.answer_text,
      }))

    if (answersData.length === 0) {
      return NextResponse.json(
        { error: "No valid answers provided" },
        { status: 400 }
      )
    }

    const { error: answersError } = await supabase
      .from("answer")
      .insert(answersData)

    if (answersError) {
      console.error("Failed to save answers:", answersError)
      return NextResponse.json(
        { error: "Failed to save answers" },
        { status: 500 }
      )
    }

    // Mark form as submitted
    const { error: updateError } = await supabase
      .from("form")
      .update({ 
        submitted_at: new Date().toISOString(),
        submitted_via: "vapi_call"
      })
      .eq("id", formId)

    if (updateError) {
      console.error("Failed to update form status:", updateError)
      return NextResponse.json(
        { error: "Failed to update form status" },
        { status: 500 }
      )
    }

    // Revalidate paths
    revalidatePath(`/dashboard/patients/${form.patient_id}`)
    revalidatePath("/patient/dashboard")

    console.log(`Form ${formId} submitted successfully via VAPI with ${answersData.length} answers`)

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      answersCount: answersData.length,
    })
  } catch (error) {
    console.error("VAPI submit error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    )
  }
}

