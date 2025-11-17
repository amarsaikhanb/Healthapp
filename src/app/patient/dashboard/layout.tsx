import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/roles"
import { PatientSidebar } from "@/components/patient-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify user is a patient
  const role = await getUserRole()
  
  if (role !== "patient") {
    // Not a patient, redirect to appropriate dashboard
    if (role === "doctor") {
      redirect("/dashboard")
    } else {
      redirect("/login?error=unauthorized")
    }
  }

  // Get patient data
  const { data: patient } = await supabase
    .from("patient")
    .select("*, doctor:doctor_id(*)")
    .eq("id", user.id)
    .single()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <PatientSidebar patient={patient} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

