"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Session = {
  id: string
  patient_id: string
  doctor_id: string
  transcript: string | null
  summary: string | null
  inferences: string[] | null
  medications: any[] | null
  created_at: string
  ended_at: string | null
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: Session
}

/**
 * Create a new session
 */
export async function createSession(patientId: string): Promise<ActionResult> {
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
      return { success: false, error: "Patient not found or unauthorized" }
    }

    const { data, error } = await supabase
      .from("session")
      .insert({
        patient_id: patientId,
        doctor_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create session",
    }
  }
}

/**
 * Update session with transcript
 */
export async function updateSessionTranscript(
  sessionId: string,
  transcript: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("session")
      .update({ transcript })
      .eq("id", sessionId)
      .eq("doctor_id", user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update transcript",
    }
  }
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("session")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("doctor_id", user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.patient_id) {
      revalidatePath(`/dashboard/patients/${data.patient_id}`)
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end session",
    }
  }
}

/**
 * Get sessions for a patient
 */
export async function getPatientSessions(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("session")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as any }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sessions",
    }
  }
}

