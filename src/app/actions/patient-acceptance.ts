"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export type AcceptInvitationData = {
  name: string
  phoneNumber: string | null
  dateOfBirth: string | null
  password: string
}

export type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Accept patient invitation and complete profile
 */
export async function acceptInvitation(
  token: string,
  data: AcceptInvitationData
): Promise<ActionResult> {
  try {
    // Use service role client to bypass RLS for token lookup
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Validate input
    if (!token || token.trim().length === 0) {
      return { success: false, error: "Invalid invitation token" }
    }

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    // Validate phone number if provided
    if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(data.phoneNumber)) {
        return { success: false, error: "Invalid phone number format" }
      }
    }

    // Find patient by invitation token (using admin client to bypass RLS)
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from("patient")
      .select("*")
      .eq("invitation_token", token)
      .single()

    if (fetchError || !patient) {
      console.error("Token lookup error:", fetchError)
      return { 
        success: false, 
        error: "Invalid or expired invitation token" 
      }
    }

    // Check if invitation already accepted
    if (patient.invitation_accepted) {
      return { 
        success: false, 
        error: "This invitation has already been accepted" 
      }
    }

    // Step 1: Create auth user account with the patient's email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: patient.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: data.name.trim(),
        role: 'patient'
      }
    })

    if (authError) {
      console.error("Auth user creation error:", authError)
      return { 
        success: false, 
        error: authError.message || "Failed to create account"
      }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    // Step 2: Update patient profile with user ID and accepted status
    const { error: updateError } = await supabaseAdmin
      .from("patient")
      .update({
        id: authData.user.id, // Link patient record to auth user
        name: data.name.trim(),
        phone_number: data.phoneNumber?.trim() || null,
        date_of_birth: data.dateOfBirth || null,
        invitation_accepted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("invitation_token", token) // Use token to find the record

    if (updateError) {
      console.error("Update error:", updateError)
      // If patient update fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Acceptance error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to accept invitation" 
    }
  }
}

/**
 * Verify invitation token without accepting
 */
export async function verifyInvitationToken(token: string): Promise<ActionResult> {
  try {
    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: patient, error } = await supabaseAdmin
      .from("patient")
      .select("email, invitation_accepted")
      .eq("invitation_token", token)
      .single()

    if (error || !patient) {
      return { 
        success: false, 
        error: "Invalid or expired invitation token" 
      }
    }

    if (patient.invitation_accepted) {
      return { 
        success: false, 
        error: "This invitation has already been accepted" 
      }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: "Failed to verify invitation" 
    }
  }
}

