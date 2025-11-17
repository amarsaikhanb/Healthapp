import { createClient } from "@/lib/supabase/server"

export type UserRole = "doctor" | "patient" | null

export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user is a doctor
  const { data: doctor } = await supabase
    .from("doctor")
    .select("id")
    .eq("id", user.id)
    .single()

  if (doctor) {
    return "doctor"
  }

  // Check if user is a patient
  const { data: patient } = await supabase
    .from("patient")
    .select("id")
    .eq("id", user.id)
    .single()

  if (patient) {
    return "patient"
  }

  return null
}

export async function requireRole(allowedRoles: UserRole[]): Promise<boolean> {
  const role = await getUserRole()
  return role !== null && allowedRoles.includes(role)
}

