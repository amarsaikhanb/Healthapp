"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { scheduleFormCall } from "@/lib/qstash"

export type Form = {
  id: string
  doctor_id: string
  patient_id: string
  title: string
  created_at: string
  submitted_at: string | null
}

export type Question = {
  id: string
  form_id: string
  question_text: string
  question_order: number
  created_at: string
}

export type Answer = {
  id: string
  form_id: string
  question_id: string
  answer_text: string | null
  created_at: string
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

/**
 * Create a new form for a patient
 */
export async function createForm(
  patientId: string,
  title: string,
  questions: string[],
  deadline?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify patient belongs to this doctor
    const { data: patient } = await supabase
      .from("patient")
      .select("id")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single()

    if (!patient) {
      return { success: false, error: "Patient not found" }
    }

    // Create form
    const { data: form, error: formError} = await supabase
      .from("form")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
        title: title || "Health Assessment Form",
        deadline: deadline || null,
      })
      .select()
      .single()

    if (formError || !form) {
      return { success: false, error: formError?.message || "Failed to create form" }
    }

    // Create questions
    const questionsData = questions.map((q, index) => ({
      form_id: form.id,
      question_text: q,
      question_order: index,
    }))

    const { error: questionsError } = await supabase
      .from("question")
      .insert(questionsData)

    if (questionsError) {
      // Rollback: delete the form
      await supabase.from("form").delete().eq("id", form.id)
      return { success: false, error: "Failed to create questions" }
    }

    // Schedule VAPI call at deadline if provided
    if (deadline) {
      try {
        const deadlineDate = new Date(deadline)
        await scheduleFormCall(form.id, deadlineDate)
        console.log(`Scheduled call for form ${form.id} at ${deadlineDate}`)
      } catch (error) {
        console.error('Failed to schedule call:', error)
        // Don't fail form creation if scheduling fails
      }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath("/patient/dashboard")

    return { success: true, data: form }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create form",
    }
  }
}

/**
 * Get all forms for a patient (doctor view)
 */
export async function getPatientForms(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("form")
      .select(`
        *,
        questions:question(*)
      `)
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forms",
    }
  }
}

/**
 * Get form with questions and answers (patient view)
 */
export async function getFormForPatient(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get form
    const { data: form, error: formError } = await supabase
      .from("form")
      .select("*")
      .eq("id", formId)
      .eq("patient_id", user.id)
      .single()

    if (formError || !form) {
      return { success: false, error: "Form not found" }
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from("question")
      .select("*")
      .eq("form_id", formId)
      .order("question_order", { ascending: true })

    if (questionsError) {
      return { success: false, error: "Failed to fetch questions" }
    }

    // Get existing answers
    const { data: answers } = await supabase
      .from("answer")
      .select("*")
      .eq("form_id", formId)

    return {
      success: true,
      data: {
        form,
        questions: questions || [],
        answers: answers || [],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch form",
    }
  }
}

/**
 * Submit form answers (patient action)
 */
export async function submitFormAnswers(
  formId: string,
  answers: { questionId: string; answerText: string }[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify form belongs to this patient
    const { data: form } = await supabase
      .from("form")
      .select("id")
      .eq("id", formId)
      .eq("patient_id", user.id)
      .single()

    if (!form) {
      return { success: false, error: "Form not found" }
    }

    // Delete existing answers
    await supabase.from("answer").delete().eq("form_id", formId)

    // Insert new answers
    const answersData = answers.map((a) => ({
      form_id: formId,
      question_id: a.questionId,
      answer_text: a.answerText,
    }))

    const { error: answersError } = await supabase
      .from("answer")
      .insert(answersData)

    if (answersError) {
      return { success: false, error: "Failed to save answers" }
    }

    // Mark form as submitted
    const { error: updateError } = await supabase
      .from("form")
      .update({ 
        submitted_at: new Date().toISOString(),
        submitted_via: "manual"
      })
      .eq("id", formId)

    if (updateError) {
      return { success: false, error: "Failed to update form status" }
    }

    revalidatePath("/patient/dashboard")

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit answers",
    }
  }
}

/**
 * Get patient's pending forms
 */
export async function getPatientPendingForms(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("form")
      .select(`
        *,
        doctor:doctor_id(name)
      `)
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forms",
    }
  }
}

