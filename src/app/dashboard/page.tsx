import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { PatientsTable } from "@/components/patients-table"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all patients for this doctor
  const { data: patients } = await supabase
    .from("patient")
    .select("*")
    .eq("doctor_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="My Patients"
        description={`Manage your ${patients?.length || 0} patient(s)`}
        showInviteButton={true}
      />

      <PatientsTable patients={patients || []} />
    </div>
  )
}

