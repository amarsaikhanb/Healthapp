"use server"

import { createClient } from "@/lib/supabase/server"
import { createVapiCall, buildFormAssistant, formatPhoneNumberE164 } from "@/lib/vapi"
import { revalidatePath } from "next/cache"

export type ActionResult = {
  success: boolean
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

/**
 * Make an outbound call to patient for form collection
 */
export async function makeFormCall(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

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
      .eq("doctor_id", user.id)
      .single()

    if (formError || !form) {
      return { success: false, error: "Form not found" }
    }

    if (!form.patient?.phone_number) {
      return { success: false, error: "Patient phone number not available" }
    }

    if (form.submitted_at) {
      return { success: false, error: "Form already submitted" }
    }

    // Allow retrying calls even if a previous call was made (answers might not have been collected)
    if (form.call_made_at) {
      console.log(`Retrying call for form ${formId} (previous call at ${form.call_made_at})`)
    }

    // Get questions
    const { data: questions } = await supabase
      .from("question")
      .select("*")
      .eq("form_id", formId)
      .order("question_order", { ascending: true })

    if (!questions || questions.length === 0) {
      return { success: false, error: "No questions found for this form" }
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
    const callResponse = await createVapiCall({
      customer: {
        number: formattedPhone,
        name: form.patient.name || "Patient",
      },
      assistant,
      metadata: {
        formId: form.id,
        patientId: form.patient.id,
        doctorId: user.id,
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

    revalidatePath(`/dashboard/patients/${form.patient.id}`)

    return {
      success: true,
      data: {
        callId: callResponse.id,
        message: "Call initiated successfully",
      },
    }
  } catch (error) {
    console.error("Make call error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to make call",
    }
  }
}

/**
 * Check for overdue forms and make calls
 */
export async function checkOverdueForms(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get all overdue forms that haven't been called
    const { data: overdueForms } = await supabase
      .from("form")
      .select(`
        *,
        patient:patient_id (
          id,
          name,
          phone_number
        )
      `)
      .is("submitted_at", null)
      .eq("call_scheduled", false)
      .not("deadline", "is", null)
      .lt("deadline", new Date().toISOString())

    if (!overdueForms || overdueForms.length === 0) {
      return {
        success: true,
        data: { message: "No overdue forms found", count: 0 },
      }
    }

    const results = []

    for (const form of overdueForms) {
      if (!form.patient?.phone_number) {
        console.log(`Skipping form ${form.id}: no phone number`)
        continue
      }

      try {
        // Get questions
        const { data: questions } = await supabase
          .from("question")
          .select("*")
          .eq("form_id", form.id)
          .order("question_order", { ascending: true })

        if (!questions || questions.length === 0) {
          continue
        }

        // Build callback URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        const callbackUrl = baseUrl?.startsWith('http')
          ? `${baseUrl}/api/forms/vapi-submit`
          : `https://${baseUrl}/api/forms/vapi-submit`

        // Build assistant with callback
        const assistant = buildFormAssistant(
          form.patient.name || "Patient",
          form.title,
          questions,
          callbackUrl
        )

        // Format phone number to E.164
        const formattedPhone = formatPhoneNumberE164(form.patient.phone_number)

        // Make call
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

        // Update form
        await supabase
          .from("form")
          .update({
            call_scheduled: true,
            call_made_at: new Date().toISOString(),
            call_sid: callResponse.id,
          })
          .eq("id", form.id)

        results.push({
          formId: form.id,
          callId: callResponse.id,
          success: true,
        })
      } catch (error) {
        console.error(`Failed to call for form ${form.id}:`, error)
        results.push({
          formId: form.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return {
      success: true,
      data: {
        message: `Processed ${results.length} overdue forms`,
        results,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check overdue forms",
    }
  }
}

