"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Doctor = {
  id: string
  name: string
  phone_number: string | null
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: Doctor
}

/**
 * Get doctor profile by user ID
 */
export async function getDoctorProfile(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("doctor")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      // If no profile exists, return null data
      if (error.code === "PGRST116") {
        return { success: true, data: undefined }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch profile" 
    }
  }
}

/**
 * Create or update doctor profile
 */
export async function upsertDoctorProfile(
  name: string,
  phoneNumber: string | null
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Name is required" }
    }

    if (name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    // Validate phone number if provided
    if (phoneNumber && phoneNumber.trim().length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(phoneNumber)) {
        return { success: false, error: "Invalid phone number format" }
      }
    }

    const { data, error } = await supabase
      .from("doctor")
      .upsert({
        id: user.id,
        name: name.trim(),
        phone_number: phoneNumber?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate the settings page to show updated data
    revalidatePath("/dashboard/settings")

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save profile" 
    }
  }
}

/**
 * Delete doctor profile
 */
export async function deleteDoctorProfile(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("doctor")
      .delete()
      .eq("id", user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/settings")

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete profile" 
    }
  }
}

