"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { resend } from "@/lib/resend"
import { PatientInvitationEmail } from "@/lib/emails/patient-invitation"
import { getDoctorProfile } from "./doctor"
import { render } from "@react-email/render"

export type Patient = {
  id: string
  email: string
  name: string | null
  phone_number: string | null
  date_of_birth: string | null
  doctor_id: string
  invitation_token: string | null
  invitation_accepted: boolean
  created_at: string
  updated_at: string
}

export type ActionResult<T = unknown> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Generate a secure random invitation token
 */
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Invite a patient by email
 */
export async function invitePatient(email: string): Promise<ActionResult<Patient>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: "Invalid email address" }
    }

    // Check if patient already exists for this doctor
    const { data: existingPatient } = await supabase
      .from("patient")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("doctor_id", user.id)
      .single()

    if (existingPatient) {
      return { 
        success: false, 
        error: "Patient with this email already exists in your list" 
      }
    }

    // Get doctor profile for email
    const doctorResult = await getDoctorProfile()
    const doctorName = doctorResult.data?.name || "Your Doctor"

    // Generate invitation token
    const invitationToken = generateInvitationToken()

    // Create patient record
    const { data, error } = await supabase
      .from("patient")
      .insert({
        email: email.toLowerCase().trim(),
        doctor_id: user.id,
        invitation_token: invitationToken,
        invitation_accepted: false,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Send invitation email
    try {
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/patient/accept-invitation?token=${invitationToken}`
      
      const emailHtml = await render(
        PatientInvitationEmail({
          doctorName,
          invitationUrl,
        })
      )
      
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email.toLowerCase().trim(),
        subject: `You've been invited by ${doctorName} - Health App`,
        html: emailHtml,
      })
    } catch (emailError) {
      // Log error but don't fail the invitation
      console.error('Failed to send invitation email:', emailError)
      // You might want to store this failure in the database for retry later
    }

    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to invite patient" 
    }
  }
}

/**
 * Get all patients for the current doctor
 */
export async function getPatients(): Promise<ActionResult<Patient[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("patient")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch patients" 
    }
  }
}

/**
 * Delete a patient invitation
 */
export async function deletePatient(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("patient")
      .delete()
      .eq("id", patientId)
      .eq("doctor_id", user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete patient" 
    }
  }
}

/**
 * Resend invitation to a patient
 */
export async function resendInvitation(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get patient
    const { data: patient, error: fetchError } = await supabase
      .from("patient")
      .select("*")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single()

    if (fetchError || !patient) {
      return { success: false, error: "Patient not found" }
    }

    if (patient.invitation_accepted) {
      return { success: false, error: "Patient has already accepted the invitation" }
    }

    // Get doctor profile for email
    const doctorResult = await getDoctorProfile()
    const doctorName = doctorResult.data?.name || "Your Doctor"

    // Resend invitation email
    try {
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/patient/accept-invitation?token=${patient.invitation_token}`
      
      const emailHtml = await render(
        PatientInvitationEmail({
          doctorName,
          invitationUrl,
        })
      )
      
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: patient.email,
        subject: `Reminder: You've been invited by ${doctorName} - Health App`,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      return { 
        success: false, 
        error: "Failed to send email. Please try again later." 
      }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to resend invitation" 
    }
  }
}

