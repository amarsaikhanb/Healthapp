import { NextRequest, NextResponse } from "next/server"
import { verifyQStashSignature } from "@/lib/qstash"
import { createClient } from "@/lib/supabase/server"
import { createVapiCall, buildFormAssistant, formatPhoneNumberE164 } from "@/lib/vapi"

/**
 * QStash job to make a VAPI call for a specific form
 * Triggered at form deadline
 * Only calls if form is not yet submitted
 */
export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const signature = request.headers.get("upstash-signature")
    const body = await request.text()

    if (signature) {
      const isValid = await verifyQStashSignature(signature, body)
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    const { formId } = JSON.parse(body)

    if (!formId) {
      return NextResponse.json(
        { error: "formId is required" },
        { status: 400 }
      )
    }

    console.log(`Checking form ${formId} for scheduled call...`)

    const supabase = await createClient()

    // Get form with patient and questions
    const { data: form, error: formError } = await supabase
      .from("form")
      .select(`
        *,
        patient:patient_id (
          id,
          name,
          phone_number
        )
      `)
      .eq("id", formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      )
    }

    // Check if form is already submitted
    if (form.submitted_at) {
      console.log(`Form ${formId} already submitted, skipping call`)
      return NextResponse.json({
        success: true,
        message: "Form already submitted, call not needed",
      })
    }

    if (!form.patient?.phone_number) {
      return NextResponse.json(
        { error: "Patient phone number not available" },
        { status: 400 }
      )
    }

    // Get questions
    const { data: questions } = await supabase
      .from("question")
      .select("*")
      .eq("form_id", formId)
      .order("question_order", { ascending: true })

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this form" },
        { status: 400 }
      )
    }

    // Build callback URL for VAPI to submit answers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    const callbackUrl = baseUrl?.startsWith('http')
      ? `${baseUrl}/api/forms/vapi-submit`
      : `https://${baseUrl}/api/forms/vapi-submit`

    // Build VAPI assistant with callback URL
    const assistant = buildFormAssistant(
      form.patient.name || "Patient",
      form.title,
      questions,
      callbackUrl
    )

    // Format phone number to E.164
    const formattedPhone = formatPhoneNumberE164(form.patient.phone_number)

    // Make the call
    console.log(`Making VAPI call to ${formattedPhone} for form ${formId}`)
    const callResponse = await createVapiCall({
      customer: {
        number: formattedPhone,
        name: form.patient.name || "Patient",
      },
      assistant,
      metadata: {
        formId: form.id,
        patientId: form.patient.id,
        doctorId: form.doctor_id,
        callbackUrl,
        questions: questions.map(q => ({
          id: q.id,
          text: q.question_text,
        })),
      },
    })

    // Update form with call info
    await supabase
      .from("form")
      .update({
        call_scheduled: true,
        call_made_at: new Date().toISOString(),
        call_sid: callResponse.id,
      })
      .eq("id", formId)

    console.log(`VAPI call initiated: ${callResponse.id}`)

    return NextResponse.json({
      success: true,
      callId: callResponse.id,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Call job error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Job failed" },
      { status: 500 }
    )
  }
}

