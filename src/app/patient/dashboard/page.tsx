import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { PatientPendingForms } from "@/components/patient-pending-forms"
import { User, Phone, Calendar, Stethoscope } from "lucide-react"

export default async function PatientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get patient data with doctor info
  const { data: patient } = await supabase
    .from("patient")
    .select(`
      *,
      doctor:doctor_id (
        id,
        name,
        phone_number
      )
    `)
    .eq("id", user?.id)
    .single()

  // Get pending forms
  const { data: forms } = await supabase
    .from("form")
    .select(`
      *,
      doctor:doctor_id(name)
    `)
    .eq("patient_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="My Dashboard"
        description={`Welcome back, ${patient?.name || user?.email}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Information
            </CardTitle>
            <CardDescription>
              Your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{patient?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{patient?.email}</p>
            </div>
            {patient?.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{patient.phone_number}</p>
                </div>
              </div>
            )}
            {patient?.date_of_birth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              My Doctor
            </CardTitle>
            <CardDescription>
              Your assigned healthcare provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient?.doctor ? (
              <>
                <div>
                  <p className="text-sm font-medium">Doctor Name</p>
                  <p className="text-sm text-muted-foreground">{patient.doctor.name}</p>
                </div>
                {patient.doctor.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">{patient.doctor.phone_number}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No doctor assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Forms */}
      <PatientPendingForms forms={forms || []} />
    </div>
  )
}

